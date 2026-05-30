import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ────────────────────────────────────────────────────────────────────
// Edge Middleware: IP-based rate limit for expensive AI endpoint
//
// 設計:
// - 只擋 /api/itinerary (每次呼叫 = 1 次 Claude API)
// - 每 IP 每天 (24h) 最多 3 次
// - 用 in-memory Map (Tier A staging OK; 公開上線時換 Upstash Redis)
// - 回 429 + JSON message + 標準 X-RateLimit-* headers
// ────────────────────────────────────────────────────────────────────

const LIMIT_PER_DAY = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function getClientIp(req: NextRequest): string {
  // Vercel 注入這幾個 header, 優先順序
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

  // GC: 清掉過期紀錄 (避免 Map 無限長大)
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

export function middleware(req: NextRequest) {
  const ip = getClientIp(req);
  const result = checkAndIncrement(ip);

  const headers = new Headers({
    "X-RateLimit-Limit": String(LIMIT_PER_DAY),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)), // Unix seconds
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

  // 通過 → 讓 request 繼續, 但把 rate limit headers 帶上 (前端可讀取顯示「剩 N/3」)
  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ["/api/itinerary"],
};
