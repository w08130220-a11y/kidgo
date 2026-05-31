import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ────────────────────────────────────────────────────────────────────
// Edge Middleware: 兩件事
//   1. Auth refresh — 每個 request 觸發 getUser(), 讓 supabase-js 自動更新 access_token cookie
//      (沒做的話 access_token 過期後即使 refresh_token 還有效, 也會被當登出)
//   2. Rate limit — /api/itinerary 每 IP 每天 3 次
// ────────────────────────────────────────────────────────────────────

const LIMIT_PER_DAY = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();
  return "anonymous";
}

function checkAndIncrement(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  store.set(ip, entry);

  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  return {
    ok: entry.count <= LIMIT_PER_DAY,
    remaining: Math.max(0, LIMIT_PER_DAY - entry.count),
    resetAt: entry.resetAt,
  };
}

// ────────────────────────────────────────────────────────────────────
// Supabase auth refresh
// 按官方 SSR 範本: https://supabase.com/docs/guides/auth/server-side/nextjs
// ────────────────────────────────────────────────────────────────────
async function refreshSupabaseSession(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 觸發 getUser() 讓 supabase-js 自動 refresh 過期的 access_token
  // (refresh_token 寫進新 cookie 經由上面 setAll 帶到 response)
  await supabase.auth.getUser();

  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── /api/itinerary: rate limit ────────────────────────────────────
  if (pathname === "/api/itinerary") {
    const ip = getClientIp(req);
    const result = checkAndIncrement(ip);

    const headers = new Headers({
      "X-RateLimit-Limit": String(LIMIT_PER_DAY),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    });

    if (!result.ok) {
      const hoursLeft = Math.ceil((result.resetAt - Date.now()) / (60 * 60 * 1000));
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: `今天已用完 ${LIMIT_PER_DAY} 次 AI 規劃。${hoursLeft} 小時後恢復。註冊版本上線後會給更多次。`,
          limit: LIMIT_PER_DAY,
          remaining: 0,
          reset_at: result.resetAt,
        },
        { status: 429, headers }
      );
    }

    // 通過 → 也跑 auth refresh
    const res = await refreshSupabaseSession(req);
    headers.forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  // ─── 其他所有 request: 純 auth refresh ─────────────────────────────
  return await refreshSupabaseSession(req);
}

export const config = {
  // 跑在所有 page request, 排除靜態檔
  matcher: [
    /*
     * 跑在: 所有 routes 除了
     * - _next/static
     * - _next/image
     * - favicon.ico, logo.png, og-image.png 等
     * - 副檔名 .svg/.png/.jpg/.jpeg/.gif/.webp 開頭
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
