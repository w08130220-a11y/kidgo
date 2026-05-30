-- kidgo v1 → Tier B 初始 schema
-- 設計參考: combo-unknown-eng-plan-v2-20260529-235959.md (純內容平台版)
-- 6 大實體: pois, profiles, itineraries, likes, comments, user_points (+ point_events ledger)

-- ─────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector 預留, v1 暫不用 (POI 數量還在 retrieval+rank 範圍內)
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ─────────────────────────────────────────────────────────────────
-- 1. POIs — 全台親子場館
-- ─────────────────────────────────────────────────────────────────
CREATE TYPE poi_category AS ENUM ('park', 'museum', 'restaurant', 'zoo', 'amusement', 'indoor');
CREATE TYPE poi_source AS ENUM ('hand', 'seed', 'tdx', 'user_upload', 'admin');
CREATE TYPE poi_status AS ENUM ('pending', 'approved', 'rejected', 'archived');

CREATE TABLE pois (
  id               text PRIMARY KEY, -- 沿用 mock-data 字串 ID 格式 (poi_xxx / seed_xxx / tdx_xxx)
  name             text NOT NULL,
  category         poi_category NOT NULL,
  district         text NOT NULL,
  city             text,
  address          text,
  lat              numeric(10, 7),
  lng              numeric(10, 7),
  age_min          int NOT NULL DEFAULT 0,
  age_max          int NOT NULL DEFAULT 99,
  duration_min     int NOT NULL DEFAULT 120,
  price_min        int NOT NULL DEFAULT 0,
  price_max        int NOT NULL DEFAULT 0,
  description      text,
  tags             text[] NOT NULL DEFAULT '{}',
  photos           text[] NOT NULL DEFAULT '{}',
  phone            text,
  open_time        text,
  requires_reservation boolean DEFAULT false,
  -- AI / 編輯欄位
  estimated_kid    text,
  ai_reasoning     text,
  kid_score        int CHECK (kid_score >= 0 AND kid_score <= 10),
  -- 來源
  source           poi_source NOT NULL DEFAULT 'admin',
  source_id        text,
  contributor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Moderation
  status           poi_status NOT NULL DEFAULT 'approved',
  reviewed_by      uuid REFERENCES auth.users(id),
  reviewed_at      timestamptz,
  -- Engagement (cached aggregates)
  view_count       int NOT NULL DEFAULT 0,
  like_count       int NOT NULL DEFAULT 0,
  -- Timestamps
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pois_status_category ON pois(status, category) WHERE status = 'approved';
CREATE INDEX idx_pois_city ON pois(city) WHERE status = 'approved';
CREATE INDEX idx_pois_district ON pois(district) WHERE status = 'approved';
CREATE INDEX idx_pois_engagement ON pois(like_count DESC, view_count DESC) WHERE status = 'approved';
CREATE INDEX idx_pois_contributor ON pois(contributor_user_id) WHERE contributor_user_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. Profiles — 用戶公開資料 (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     text NOT NULL,
  avatar_url       text,
  bio              text,
  -- 給 AI 規劃用 (不公開展示)
  default_kid_ages int[] DEFAULT '{}',
  default_start_area text,
  -- 隱私
  is_public        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_public ON profiles(is_public) WHERE is_public = true;

-- 自動為新註冊用戶建 profile (display_name 從 LINE/Google 取)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      '新用戶'
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  -- 同步初始化 user_points
  INSERT INTO public.user_points (user_id, total) VALUES (new.id, 0);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- 3. Itineraries — 用戶儲存的行程
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE itineraries (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text NOT NULL,
  query            text,                    -- 原始 wizard 輸入 (JSON 序列化的 WizardData)
  wizard_data      jsonb,                   -- 結構化 WizardData
  days             jsonb NOT NULL,          -- [{ poiIds: [...], reasons: {...} }]
  estimated_cost   int NOT NULL DEFAULT 0,
  source           text NOT NULL DEFAULT 'ai', -- 'ai' | 'local' | 'manual'
  -- 公開分享
  is_public        boolean NOT NULL DEFAULT false,
  share_slug       text UNIQUE,             -- /i/{slug} 短連結
  -- Cached aggregates
  view_count       int NOT NULL DEFAULT 0,
  like_count       int NOT NULL DEFAULT 0,
  -- Timestamps
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_itineraries_user ON itineraries(user_id, created_at DESC);
CREATE INDEX idx_itineraries_public ON itineraries(is_public, like_count DESC) WHERE is_public = true;
CREATE INDEX idx_itineraries_share_slug ON itineraries(share_slug) WHERE share_slug IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 4. Likes — 多型 (POI / itinerary / comment 共用)
-- ─────────────────────────────────────────────────────────────────
CREATE TYPE like_target_type AS ENUM ('poi', 'itinerary', 'comment');

CREATE TABLE likes (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type      like_target_type NOT NULL,
  target_id        text NOT NULL, -- POI 用 string, itinerary/comment 用 uuid 字串
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- ─────────────────────────────────────────────────────────────────
-- 5. Comments — POI / Itinerary 評論
-- ─────────────────────────────────────────────────────────────────
CREATE TYPE comment_target_type AS ENUM ('poi', 'itinerary');

CREATE TABLE comments (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type      comment_target_type NOT NULL,
  target_id        text NOT NULL,
  body             text NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  age_when_visited int, -- 親子場館特有: 「我帶 5 歲去」
  photos           text[] DEFAULT '{}',
  like_count       int NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_target ON comments(target_type, target_id, created_at DESC) WHERE status = 'approved';
CREATE INDEX idx_comments_user ON comments(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- 6. User Points — Cached aggregate (read fast)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE user_points (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total            int NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_points_top ON user_points(total DESC);

-- ─────────────────────────────────────────────────────────────────
-- 7. Point Events — Ledger (write trail, idempotent)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE point_events (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta            int NOT NULL,
  reason           text NOT NULL, -- 'poi_approved' | 'poi_liked' | 'itinerary_shared' | 'invite_signup' | 'comment_liked'
  source_id        text,          -- 對應的 POI id / itinerary id 等
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- Idempotency: 同 user + reason + source_id 只能加分一次
  UNIQUE (user_id, reason, source_id)
);

CREATE INDEX idx_point_events_user ON point_events(user_id, created_at DESC);

-- 自動更新 user_points.total
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_points
  SET total = total + new.delta, updated_at = now()
  WHERE user_id = new.user_id;
  RETURN new;
END;
$$;

CREATE TRIGGER on_point_event_insert
  AFTER INSERT ON point_events
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- ─────────────────────────────────────────────────────────────────
-- updated_at 自動更新 (共用 trigger)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER trg_pois_updated_at BEFORE UPDATE ON pois
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_itineraries_updated_at BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_user_points_updated_at BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
