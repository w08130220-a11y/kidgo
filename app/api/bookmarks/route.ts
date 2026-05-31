/**
 * POST /api/bookmarks — toggle bookmark (有就刪, 沒就加)
 * body: { targetType: 'poi' | 'itinerary', targetId: string }
 * 200 → { bookmarked: boolean }
 */
import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

const VALID_TARGETS = ["poi", "itinerary"] as const;

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入" }, { status: 401 });
  }

  let body: { targetType?: string; targetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetType = body.targetType as (typeof VALID_TARGETS)[number] | undefined;
  const targetId = body.targetId;
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType + targetId 必填" }, { status: 400 });
  }
  if (!VALID_TARGETS.includes(targetType)) {
    return NextResponse.json({ error: "targetType 必須是 poi/itinerary" }, { status: 400 });
  }

  // 用 admin client 繞 RLS (我們已 auth 驗證 + 強制 user_id)
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("bookmarks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookmarked: false });
  } else {
    const { error } = await admin
      .from("bookmarks")
      .insert({ user_id: user.id, target_type: targetType, target_id: targetId });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ bookmarked: true });
  }
}
