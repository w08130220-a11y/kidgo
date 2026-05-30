/**
 * Sign out endpoint.
 * 用戶按右上 Logout → POST /auth/signout → 清掉 session cookie → redirect 回首頁
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(new URL("/", origin), { status: 303 });
}
