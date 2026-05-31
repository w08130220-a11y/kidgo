/**
 * PATCH /api/feedback/[id] — admin 更新 status / admin_note
 */
import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

function isAdmin(userId: string): boolean {
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(userId);
}

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "需要登入" }, { status: 401 });
  if (!isAdmin(user.id))
    return NextResponse.json({ error: "無權限" }, { status: 403 });

  let body: { status?: string; admin_note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "status 不對" }, { status: 400 });
    }
    update.status = body.status;
    if (body.status === "resolved" || body.status === "closed") {
      update.resolved_at = new Date().toISOString();
    } else {
      update.resolved_at = null;
    }
  }
  if (body.admin_note !== undefined) {
    update.admin_note = body.admin_note.slice(0, 1000);
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "沒任何更新" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("feedback").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
