-- 0005: 加 has_photo generated column 給排序用
-- 目的: 探索頁 / AI 候選池排序時, 有照片的 POI 排前面 (UX 較好)
-- generated 是自動算的, INSERT/UPDATE 時 Postgres 自己維護, 程式不用管.

ALTER TABLE pois
  ADD COLUMN IF NOT EXISTS has_photo boolean
  GENERATED ALWAYS AS (
    photos IS NOT NULL
    AND array_length(photos, 1) > 0
  ) STORED;

-- Index 給「has_photo DESC + like_count DESC」combined sort 用
CREATE INDEX IF NOT EXISTS idx_pois_photo_likes
  ON pois(has_photo DESC, like_count DESC)
  WHERE status = 'approved';
