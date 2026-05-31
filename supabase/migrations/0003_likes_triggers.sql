-- 0003: Likes 自動同步 cached aggregate (like_count)
-- 為什麼: API 端 INSERT/DELETE likes + 另一句 UPDATE count 不是 atomic, 高併發會 race.
-- DB trigger 內含 transaction, 保證 likes 跟 like_count 不會脫鉤.

-- ────────────────────────────────────────────────────────────────────
-- INSERT 觸發: +1 到父表 like_count
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_like_count_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.target_type = 'poi' THEN
    UPDATE pois SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'itinerary' THEN
    -- itinerary.id 是 uuid, target_id 是 text → cast
    UPDATE itineraries SET like_count = like_count + 1 WHERE id::text = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id::text = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_likes_after_insert
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION public.bump_like_count_on_insert();

-- ────────────────────────────────────────────────────────────────────
-- DELETE 觸發: -1 (clamp 到 0, 避免負值)
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.drop_like_count_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.target_type = 'poi' THEN
    UPDATE pois SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  ELSIF OLD.target_type = 'itinerary' THEN
    UPDATE itineraries SET like_count = GREATEST(like_count - 1, 0) WHERE id::text = OLD.target_id;
  ELSIF OLD.target_type = 'comment' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id::text = OLD.target_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_likes_after_delete
  AFTER DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION public.drop_like_count_on_delete();

-- ────────────────────────────────────────────────────────────────────
-- (Optional) 一次重算 + reset: 萬一 trigger 之前有缺漏可用
-- 用法: SELECT public.recalc_like_counts();
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalc_like_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- POIs
  UPDATE pois p SET like_count = COALESCE(c.cnt, 0)
  FROM (SELECT target_id, COUNT(*) AS cnt FROM likes WHERE target_type = 'poi' GROUP BY target_id) c
  WHERE p.id = c.target_id;
  UPDATE pois SET like_count = 0 WHERE id NOT IN (SELECT DISTINCT target_id FROM likes WHERE target_type = 'poi');

  -- Itineraries
  UPDATE itineraries i SET like_count = COALESCE(c.cnt, 0)
  FROM (SELECT target_id, COUNT(*) AS cnt FROM likes WHERE target_type = 'itinerary' GROUP BY target_id) c
  WHERE i.id::text = c.target_id;
  UPDATE itineraries SET like_count = 0 WHERE id::text NOT IN (SELECT DISTINCT target_id FROM likes WHERE target_type = 'itinerary');

  -- Comments
  UPDATE comments cm SET like_count = COALESCE(c.cnt, 0)
  FROM (SELECT target_id, COUNT(*) AS cnt FROM likes WHERE target_type = 'comment' GROUP BY target_id) c
  WHERE cm.id::text = c.target_id;
END;
$$;
