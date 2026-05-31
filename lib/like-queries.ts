/**
 * Server-side like-status queries.
 *
 * 用於 Server Component 進去就先一次查當前用戶按過哪些, 避免 N+1
 * (例: POI 列表頁渲染 36 個卡片, 一次回傳 Set 而不是 36 次查詢).
 */
import { createServerClient } from "@/lib/supabase/server";

type TargetType = "poi" | "itinerary" | "comment";

/**
 * 取得當前用戶有沒有按過這些 target.
 * 未登入回 empty Set.
 *
 * @returns Set<targetId> 凡是在 set 內的, 表示用戶已按讚
 */
export async function getUserLikedSet(
  targetType: TargetType,
  targetIds: string[]
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("likes")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .in("target_id", targetIds);

  return new Set((data ?? []).map((r) => (r as { target_id: string }).target_id));
}

/** 單一 target 的 boolean shortcut */
export async function isLikedByUser(
  targetType: TargetType,
  targetId: string
): Promise<boolean> {
  const set = await getUserLikedSet(targetType, [targetId]);
  return set.has(targetId);
}
