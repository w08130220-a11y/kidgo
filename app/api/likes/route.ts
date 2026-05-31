/**
 * POST /api/likes — toggle like (有就刪, 沒就加)
 *
 * body: { targetType: 'poi' | 'itinerary' | 'comment', targetId: string }
 * 200 → { liked: boolean, count: number }
 * 401 → 未登入
 * 404 → 目標不存在
 *
 * like_count 由 DB trigger (migration 0003) 自動同步, 不用手動 update.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type TargetType = "poi" | "itinerary" | "comment";

const TABLE_BY_TYPE: Record<TargetType, string> = {
  poi: "pois",
  itinerary: "itineraries",
  comment: "comments",
};

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入才能按讚" }, { status: 401 });
  }

  let body: { targetType?: string; targetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetType = body.targetType as TargetType | undefined;
  const targetId = body.targetId;
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType 跟 targetId 必填" }, { status: 400 });
  }
  if (!["poi", "itinerary", "comment"].includes(targetType)) {
    return NextResponse.json({ error: "targetType 必須是 poi/itinerary/comment" }, { status: 400 });
  }

  // 查目前是否已讚
  const { data: existing, error: selErr } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  let liked: boolean;
  if (existing) {
    // 取消讚
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    liked = false;
  } else {
    // 按讚
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: user.id, target_type: targetType, target_id: targetId });
    if (error) {
      // 23503 = FK violation (target 不存在)
      if (error.code === "23503") {
        return NextResponse.json({ error: "目標不存在" }, { status: 404 });
      }
      // 23505 = unique violation (race: 別的 tab 也按了) — 視為成功
      if (error.code !== "23505") {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    liked = true;
  }

  // 回讀最新 count (trigger 已同步)
  const table = TABLE_BY_TYPE[targetType];
  let count = 0;
  if (targetType === "poi") {
    const { data } = await supabase.from(table).select("like_count").eq("id", targetId).single();
    count = data?.like_count ?? 0;
  } else {
    // itinerary / comment id 是 uuid
    const { data } = await supabase.from(table).select("like_count").eq("id", targetId).single();
    count = data?.like_count ?? 0;
  }

  return NextResponse.json({ liked, count });
}
