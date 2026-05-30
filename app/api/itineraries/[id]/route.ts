/**
 * /api/itineraries/[id] — read (GET) + delete (DELETE)
 *
 * GET: 公開的任何人讀, 自己的不論狀態都可讀 (RLS 處理)
 * DELETE: 只有 owner 能刪
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerClient();

  // RLS handles permissions: public itineraries OR own itineraries
  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "找不到這個行程或無權限" }, { status: 404 });
  }

  // 增加 view_count (非自己的才算)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (data.user_id !== user?.id) {
    // fire-and-forget, 不阻塞 response
    void supabase
      .from("itineraries")
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq("id", id);
  }

  return NextResponse.json({ itinerary: data });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入" }, { status: 401 });
  }

  const { error } = await supabase
    .from("itineraries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
