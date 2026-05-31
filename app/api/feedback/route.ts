/**
 * POST /api/feedback — 用戶反饋
 * body: { category, body, email?, url? }
 *
 * 任何人可送 (不需登入). Rate limit: 每 IP 每小時 5 則.
 */
import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

const VALID_CATS = ["bug", "feature", "praise", "other"] as const;
type Category = (typeof VALID_CATS)[number];

// In-memory rate limit (per IP, 5/hour). Vercel serverless 重啟會清, 對小流量 OK.
const ipHits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function checkIp(ip: string): boolean {
  const now = Date.now();
  let entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  ipHits.set(ip, entry);
  return entry.count <= LIMIT;
}

function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function POST(req: Request) {
  // Rate limit
  const ip = getClientIp(req);
  if (!checkIp(ip)) {
    return NextResponse.json(
      { error: "送太多了, 1 小時後再試" },
      { status: 429 }
    );
  }

  let body: {
    category?: string;
    body?: string;
    email?: string;
    url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = body.category as Category | undefined;
  if (!category || !VALID_CATS.includes(category)) {
    return NextResponse.json({ error: "category 必填" }, { status: 400 });
  }
  const content = body.body?.trim();
  if (!content || content.length < 5 || content.length > 2000) {
    return NextResponse.json({ error: "內容請填 5-2000 字" }, { status: 400 });
  }
  const email = body.email?.trim();
  if (email && (!email.includes("@") || email.length > 200)) {
    return NextResponse.json({ error: "email 格式不對" }, { status: 400 });
  }

  // 取已登入用戶 (有就帶上)
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 用 admin client 寫入 (反正 RLS 也允許 anonymous insert)
  const admin = createAdminClient();
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { data, error } = await admin
    .from("feedback")
    .insert({
      user_id: user?.id ?? null,
      email: email || user?.email || null,
      category,
      body: content,
      url: body.url?.slice(0, 500) ?? null,
      user_agent: userAgent,
      status: "open",
    })
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ feedback: data });
}
