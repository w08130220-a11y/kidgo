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
5. 再貼 `0004_bookmarks.sql` → Run (想去清單 bookmarks table)
6. 成功後 Tables 應該看得到 pois / profiles / itineraries / likes / comments / user_points / point_events / bookmarks

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

### 6. Storage bucket (UGC 上傳照片需要)

Dashboard → Storage → New bucket:

```
Name:           poi-photos
Public bucket:  ✓ 勾起來 (public read)
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

建好後加 RLS policy 讓登入用戶可以寫:

```sql
-- 寫入: 登入用戶可以在自己的資料夾下上傳
CREATE POLICY "poi_photos_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'poi-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 讀取: 任何人都可以讀 (public bucket)
CREATE POLICY "poi_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'poi-photos');

-- 用戶可以刪自己的
CREATE POLICY "poi_photos_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'poi-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 7. Admin 設定 (UGC 審核)

要審核用戶上傳的 POI, 把你的 user ID 加到 env:

1. 先登入網站, 去 `/admin/pois` (會被擋, 但會顯示你的 user ID)
2. 複製那個 UUID
3. 加到 `.env.local` (本地) + Vercel env (production):
   ```
   ADMIN_USER_IDS=你的-uuid-在這
   ```
   多個 admin 用逗號分隔:
   ```
   ADMIN_USER_IDS=uuid-1,uuid-2,uuid-3
   ```
4. Vercel 改完要 Redeploy 才生效
