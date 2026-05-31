/**
 * POST /api/comments — 新增留言
 * body: { targetType, targetId, body, ageWhenVisited? }
 *
 * 認證 + RLS 雙重保護.
 * Rate limit: 每用戶每 10 分鐘最多 5 則留言.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type TargetType = "poi" | "itinerary";

const VALID_TARGETS = ["poi", "itinerary"] as const;

function fail(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("需要登入才能留言", 401);

  let b: {
    targetType?: string;
    targetId?: string;
    body?: string;
    ageWhenVisited?: number | null;
  };
  try {
    b = await req.json();
  } catch {
    return fail("Invalid JSON");
  }

  const targetType = b.targetType as TargetType | undefined;
  const targetId = b.targetId?.trim();
  const body = b.body?.trim();
  const age = b.ageWhenVisited;

  if (!targetType || !VALID_TARGETS.includes(targetType)) {
    return fail("targetType 必須是 poi / itinerary");
  }
  if (!targetId) return fail("targetId 必填");
  if (!body || body.length < 1 || body.length > 500) {
    return fail("留言內容 1-500 字");
  }
  if (age !== null && age !== undefined) {
    if (!Number.isInteger(age) || age < 0 || age > 18) {
      return fail("年齡 0-18");
    }
  }

  // Rate limit: 過去 10 分鐘 ≤ 5 則
  const tenMinAgo = new Date(Date.now() - 600_000).toISOString();
  const { count: recent } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", tenMinAgo);
  if ((recent ?? 0) >= 5) {
    return fail("留太多了, 10 分鐘後再來", 429);
  }

  // 驗證 target 存在 (避免亂寫 ID)
  if (targetType === "poi") {
    const { data: poi } = await supabase
      .from("pois")
      .select("id")
      .eq("id", targetId)
      .eq("status", "approved")
      .maybeSingle();
    if (!poi) return fail("景點不存在", 404);
  } else {
    const { data: it } = await supabase
      .from("itineraries")
      .select("id, is_public, user_id")
      .eq("id", targetId)
      .maybeSingle();
    if (!it) return fail("行程不存在", 404);
    // 只能對公開或自己的行程留言
    const itTyped = it as { is_public: boolean; user_id: string };
    if (!itTyped.is_public && itTyped.user_id !== user.id) {
      return fail("無權限留言此行程", 403);
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      body,
      age_when_visited: age ?? null,
    })
    .select("id, body, age_when_visited, created_at")
    .single();

  if (error) {
    return fail(error.message, 500);
  }
  return NextResponse.json({ comment: data });
}
