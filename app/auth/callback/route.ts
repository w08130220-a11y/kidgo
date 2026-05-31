/**
 * OAuth callback handler
 *
 * 用戶從 Google (或之後 LINE 等) 登入完成後, provider 會 redirect 回這個 endpoint
 * 帶著 ?code=xxx, 我們用 code 交換 session.
 *
 * 流程:
 *   1. 用戶點 LoginPromptModal 的「用 Google 登入」
 *   2. supabase.auth.signInWithOAuth({ provider: 'google' }) 把用戶送到 Google
 *   3. Google 登入完 redirect 到 .../auth/callback?code=xxx&next=/some-path
 *   4. 這個 handler 用 code 換 session, 寫進 cookie, 然後 redirect 到 next
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  // Vercel 反向代理時 req.url 的 host 可能是內部 URL,
  // x-forwarded-host 才是真實對外 host (例 www.kidgo.life)
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  const baseOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : url.origin;

  if (!code) {
    return NextResponse.redirect(`${baseOrigin}/?login_error=no_code`);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(
      `${baseOrigin}/?login_error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${baseOrigin}${next}`);
}
