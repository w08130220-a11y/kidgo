/**
 * /api/itineraries — list (GET) + save (POST)
 *
 * 全部需要登入. RLS 額外保護 (即使有人繞過這層, DB 也擋住)
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("id, title, days, estimated_cost, is_public, share_slug, like_count, view_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ itineraries: data });
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入才能儲存行程" }, { status: 401 });
  }

  let body: {
    title?: string;
    wizardData?: unknown;
    days?: { poiIds: string[] }[];
    reasons?: Record<string, string>;
    estimatedCost?: number;
    source?: "ai" | "local" | "manual";
    isPublic?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 基本驗證
  if (!body.title || typeof body.title !== "string" || body.title.length > 200) {
    return NextResponse.json({ error: "title 必填 (1-200 字)" }, { status: 400 });
  }
  if (!Array.isArray(body.days) || body.days.length === 0) {
    return NextResponse.json({ error: "days 必填" }, { status: 400 });
  }
  if (body.days.length > 10) {
    return NextResponse.json({ error: "最多 10 天" }, { status: 400 });
  }

  const insert = {
    user_id: user.id,
    title: body.title.trim(),
    wizard_data: body.wizardData ?? null,
    days: { days: body.days, reasons: body.reasons ?? {} },
    estimated_cost: body.estimatedCost ?? 0,
    source: body.source ?? "ai",
    is_public: body.isPublic ?? false,
  };

  const { data, error } = await supabase
    .from("itineraries")
    .insert(insert)
    .select("id, title, share_slug, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ itinerary: data });
}
