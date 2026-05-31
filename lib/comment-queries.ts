/**
 * Server-side comment queries.
 * 一次回傳 (comment + author profile + 我有沒按讚過) 給 server component 渲染.
 */
import { createAdminClient, createServerClient } from "@/lib/supabase/server";

type TargetType = "poi" | "itinerary";

export type CommentWithAuthor = {
  id: string;
  body: string;
  ageWhenVisited: number | null;
  likeCount: number;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  isOwn: boolean;
  isLiked: boolean;
};

/**
 * 撈某 target 的所有 approved 留言 + 作者 + 當前用戶按讚狀態
 * 不分頁, v1 直接 limit 100 (留言量大再做)
 */
export async function getCommentsFor(
  targetType: TargetType,
  targetId: string
): Promise<CommentWithAuthor[]> {
  // 用 admin client 一次撈全部 (RLS 不會 filter 掉, 因為留言預設 approved)
  // server client + getUser 用於判斷 isOwn / isLiked
  const admin = createAdminClient();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comments } = await admin
    .from("comments")
    .select("id, user_id, body, age_when_visited, like_count, created_at, status")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!comments || comments.length === 0) return [];

  // 撈所有作者 profile
  const authorIds = Array.from(
    new Set(comments.map((c) => (c as { user_id: string }).user_id))
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", authorIds);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      p as { id: string; display_name: string; avatar_url: string | null },
    ])
  );

  // 撈當前用戶讚過哪些留言
  let likedSet = new Set<string>();
  if (user) {
    const commentIds = comments.map((c) => (c as { id: string }).id);
    const { data: likes } = await admin
      .from("likes")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("target_type", "comment")
      .in("target_id", commentIds);
    likedSet = new Set(
      (likes ?? []).map((l) => (l as { target_id: string }).target_id)
    );
  }

  return comments.map((c) => {
    const row = c as {
      id: string;
      user_id: string;
      body: string;
      age_when_visited: number | null;
      like_count: number;
      created_at: string;
    };
    const author = profileMap.get(row.user_id);
    return {
      id: row.id,
      body: row.body,
      ageWhenVisited: row.age_when_visited,
      likeCount: row.like_count ?? 0,
      createdAt: row.created_at,
      authorId: row.user_id,
      authorName: author?.display_name ?? "匿名爸媽",
      authorAvatar: author?.avatar_url ?? null,
      isOwn: user?.id === row.user_id,
      isLiked: likedSet.has(row.id),
    };
  });
}
