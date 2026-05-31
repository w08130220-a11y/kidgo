-- 0006: 用戶反饋系統 (給「給我們建議」用)
-- 任何人可寫 (不需登入), 只有 admin 可讀 (service_role 繞 RLS)

CREATE TABLE IF NOT EXISTS feedback (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email        text,
  category     text NOT NULL CHECK (category IN ('bug', 'feature', 'praise', 'other')),
  body         text NOT NULL CHECK (length(body) BETWEEN 5 AND 2000),
  url          text,
  user_agent   text,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_note   text,
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status_created
  ON feedback(status, created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 任何人可寫入 (登入或未登入都行, rate limit 在 API 端做)
DROP POLICY IF EXISTS "feedback_anyone_insert" ON feedback;
CREATE POLICY "feedback_anyone_insert"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- 不開 SELECT / UPDATE / DELETE policy → 只有 service_role 可讀寫
-- (admin dashboard 走 service_role bypass RLS)
