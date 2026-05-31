/**
 * DELETE /api/comments/[id] — 刪自己的留言
 * RLS 自動擋: 別人的刪不掉.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入" }, { status: 401 });
  }

  const { error, count } = await supabase
    .from("comments")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json({ error: "找不到留言或無權限" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
