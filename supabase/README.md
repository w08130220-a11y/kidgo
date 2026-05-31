# Supabase Setup

## 一次性設定

### 1. 開 Supabase 專案
- https://supabase.com/dashboard → New Project
- 名稱: `kidgo-prod` (隨意)
- 區域: **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)** 對台灣最快
- DB password: 自己設, **記在密碼管理器**

### 2. 拿 3 個 keys

Settings → API:

```
Project URL          NEXT_PUBLIC_SUPABASE_URL
anon public key      NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key     SUPABASE_SERVICE_ROLE_KEY  ⚠ 機密
```

加到 `.env.local`.

### 3. 跑 migrations

兩種方式:

**A. Supabase Dashboard (推薦, 初次設定)**
1. Dashboard → SQL Editor → New query
2. 把 `supabase/migrations/0001_init.sql` 全部貼上 → Run
3. 再貼 `0002_rls.sql` → Run
4. 再貼 `0003_likes_triggers.sql` → Run (按讚自動同步計數)
5. 成功後 Tables 應該看得到 pois / profiles / itineraries / likes / comments / user_points / point_events

**B. Supabase CLI (之後改 schema 用)**
```bash
pnpm add -g supabase
supabase login
supabase link --project-ref xxxxxx  # 你的 project id
supabase db push
```

### 4. 設 Auth Providers (LINE + Google)

#### LINE Login
1. https://developers.line.biz → Create channel → **LINE Login**
2. 拿 `Channel ID` + `Channel Secret`
3. Callback URL 填: `https://你的-project.supabase.co/auth/v1/callback`
4. 回 Supabase Dashboard → Authentication → Providers → 啟用 LINE → 貼 ID/Secret

#### Google OAuth
1. https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth client ID (Web application)
3. Authorized redirect URI: `https://你的-project.supabase.co/auth/v1/callback`
4. 拿 `Client ID` + `Client Secret`
5. 回 Supabase Dashboard → Auth → Providers → 啟用 Google → 貼

### 5. 灌 POI 資料

完成所有上面之後:
```bash
pnpm pois:import
```

會把 hand-curated + seed + (跑完 enrich 的) TDX POI 一次灌進 Supabase `pois` table.
