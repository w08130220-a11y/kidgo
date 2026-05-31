/**
 * POST /api/pois/[id]/moderate — admin 審核 UGC POI
 * body: { action: 'approve' | 'reject' }
 *
 * 只有 ADMIN_USER_IDS env 裡的 user 可以呼叫 (用 service_role 繞 RLS).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

function isAdmin(userId: string): boolean {
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(userId);
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "需要登入" }, { status: 401 });
  if (!isAdmin(user.id)) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "action 必須是 approve / reject" }, { status: 400 });
  }

  // 用 service_role 繞 RLS (admin 操作 trusted)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const newStatus = body.action === "approve" ? "approved" : "rejected";
  const { error } = await admin
    .from("pois")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status: newStatus });
}
