-- 0004: Bookmarks (想去清單) — 跟 likes 分開
-- 語意:
--   like     = 公開喜歡, 計數展示給所有人
--   bookmark = 私密「以後想去」, 只有自己看得到
-- 不像 likes 有 trigger 更新 cached count, 這裡純記錄, 無 count.

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type      text NOT NULL CHECK (target_type IN ('poi', 'itinerary')),
  target_id        text NOT NULL,
  note             text, -- 自己備註 (例如「夏天去」「等老二大一點」)
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, created_at DESC);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 用戶只能讀寫自己的 (私密)
DROP POLICY IF EXISTS "bookmarks_self_read" ON bookmarks;
CREATE POLICY "bookmarks_self_read"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "bookmarks_self_insert" ON bookmarks;
CREATE POLICY "bookmarks_self_insert"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "bookmarks_self_delete" ON bookmarks;
CREATE POLICY "bookmarks_self_delete"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
