-- Row Level Security (RLS) policies
-- 原則:
--   - POI / approved 內容: 公開讀
--   - 用戶自己的內容: 只有自己 + admin (service_role) 能寫
--   - Like / comment: 登入後可寫, 自己的可刪
--   - Service role bypass everything

-- ─────────────────────────────────────────────────────────────────
-- POIs
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;

-- 任何人都能讀 approved POI
CREATE POLICY "pois_public_read"
  ON pois FOR SELECT
  USING (status = 'approved');

-- 登入用戶可以上傳 POI (status 強制 pending)
CREATE POLICY "pois_user_insert"
  ON pois FOR INSERT
  TO authenticated
  WITH CHECK (
    contributor_user_id = auth.uid()
    AND source = 'user_upload'
    AND status = 'pending'
  );

-- contributor 可以改自己上傳的 pending POI (還沒 approved 前可修正)
CREATE POLICY "pois_contributor_update_pending"
  ON pois FOR UPDATE
  TO authenticated
  USING (
    contributor_user_id = auth.uid()
    AND status = 'pending'
  );

-- ─────────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 公開 profile 任何人可讀
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT
  USING (is_public = true);

-- 自己永遠可讀自己的 (不論 is_public)
CREATE POLICY "profiles_self_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 只有自己可以改自己
CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- Itineraries
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- 公開的行程任何人讀
CREATE POLICY "itineraries_public_read"
  ON itineraries FOR SELECT
  USING (is_public = true);

-- 自己的行程自己讀
CREATE POLICY "itineraries_self_read"
  ON itineraries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 自己可以建立行程
CREATE POLICY "itineraries_self_insert"
  ON itineraries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 自己可以改自己的行程
CREATE POLICY "itineraries_self_update"
  ON itineraries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 自己可以刪自己的行程
CREATE POLICY "itineraries_self_delete"
  ON itineraries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- Likes
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 任何人可讀 like (用於計算/顯示)
CREATE POLICY "likes_public_read"
  ON likes FOR SELECT
  USING (true);

-- 登入用戶可以按讚 (限自己 user_id)
CREATE POLICY "likes_self_insert"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 可以取消自己的讚
CREATE POLICY "likes_self_delete"
  ON likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 已 approved 的評論任何人可讀
CREATE POLICY "comments_approved_read"
  ON comments FOR SELECT
  USING (status = 'approved');

-- 自己的評論不論狀態都可讀
CREATE POLICY "comments_self_read"
  ON comments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 登入可建評論 (狀態強制 pending, 等審核; v1 簡化先預設 approved)
CREATE POLICY "comments_self_insert"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 自己可改自己的評論 (5 分鐘內或永遠 v1 不限)
CREATE POLICY "comments_self_update"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 自己可刪
CREATE POLICY "comments_self_delete"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- User Points / Point Events
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;

-- user_points 公開讀 (排行榜需要)
CREATE POLICY "user_points_public_read"
  ON user_points FOR SELECT
  USING (true);

-- point_events 只有自己讀 (避免被別人窺看你的積分歷史)
CREATE POLICY "point_events_self_read"
  ON point_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 寫入 point_events 一律由 service_role (server-side trusted) 操作
-- 不開放 client 端 insert/update/delete
-- (避免用戶自己幫自己加分)
