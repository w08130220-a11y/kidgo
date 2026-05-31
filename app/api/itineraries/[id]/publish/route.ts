/**
 * POST /api/itineraries/[id]/publish — 標記為公開 + 生成 share_slug
 * DELETE /api/itineraries/[id]/publish — 取消公開
 *
 * 公開後任何人 (含未登入) 可以開 /i/{slug} 看
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

// Slug: 8 字元隨機 (base36)
function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "需要登入" }, { status: 401 });
  }

  // 確認 owner
  const { data: it } = await supabase
    .from("itineraries")
    .select("id, user_id, share_slug, is_public")
    .eq("id", id)
    .single();

  if (!it || it.user_id !== user.id) {
    return NextResponse.json({ error: "找不到行程或無權限" }, { status: 404 });
  }

  // 已有 slug → 沿用; 沒則生成新的 (避免重複)
  let slug = it.share_slug as string | null;
  if (!slug) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateSlug();
      const { data: existing } = await supabase
        .from("itineraries")
        .select("id")
        .eq("share_slug", candidate)
        .maybeSingle();
      if (!existing) {
        slug = candidate;
        break;
      }
    }
    if (!slug) {
      return NextResponse.json({ error: "生成短連結失敗, 請重試" }, { status: 500 });
    }
  }

  const { error } = await supabase
    .from("itineraries")
    .update({ is_public: true, share_slug: slug })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug, url: `/i/${slug}` });
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
    .update({ is_public: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
