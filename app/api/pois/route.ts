/**
 * POST /api/pois — 用戶上傳新景點 (UGC)
 * GET  /api/pois/mine — 列出自己上傳的 (含 pending/rejected, 不開放 list 別人的)
 *
 * 寫入時 status='pending', source='user_upload', contributor_user_id=auth.uid()
 * RLS 自動擋: 沒登入會被擋, 不登入也讀不到別人的 pending.
 *
 * 圖片: client 直接上傳到 Storage bucket `poi-photos` 取得 URL, 這裡只存 URL.
 */
import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

const VALID_CATEGORIES = ["park", "museum", "restaurant", "zoo", "amusement", "indoor"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

// 控制 tag 來自固定清單, 避免亂打
const VALID_TAGS = new Set([
  "戶外", "室內", "室內外", "免費", "雨天首選", "雨天備案",
  "推車友善", "有遊戲區", "捷運直達", "需開車",
  "動物互動", "可野餐", "玩水", "夏天首選", "季節限定",
  "可過夜", "需訂位", "無障礙",
]);

type PostBody = {
  name?: string;
  category?: string;
  district?: string;
  city?: string;
  address?: string;
  ageMin?: number;
  ageMax?: number;
  durationMin?: number;
  priceMin?: number;
  priceMax?: number;
  description?: string;
  tags?: string[];
  photos?: string[]; // URLs (從 Storage 上傳完拿到的)
  phone?: string;
  requiresReservation?: boolean;
};

function fail(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("需要登入才能上傳景點", 401);

  let b: PostBody;
  try {
    b = await req.json();
  } catch {
    return fail("Invalid JSON");
  }

  // ─── 驗證 ────────────────────────────────────────────────────
  const name = b.name?.trim();
  if (!name || name.length < 2 || name.length > 100) {
    return fail("景點名稱必填 (2-100 字)");
  }
  if (!b.category || !VALID_CATEGORIES.includes(b.category as Category)) {
    return fail(`類別必須是 ${VALID_CATEGORIES.join(" / ")}`);
  }
  if (!b.district || b.district.length > 50) return fail("區域必填 (≤ 50 字)");
  if (!b.city || b.city.length > 20) return fail("縣市必填");
  if (!b.description || b.description.length < 10 || b.description.length > 500) {
    return fail("描述必填 (10-500 字)");
  }
  const ageMin = Number(b.ageMin ?? 0);
  const ageMax = Number(b.ageMax ?? 99);
  if (!Number.isInteger(ageMin) || ageMin < 0 || ageMin > 18) return fail("最小年齡 0-18");
  if (!Number.isInteger(ageMax) || ageMax < 0 || ageMax > 99 || ageMax < ageMin) {
    return fail("最大年齡 ≥ 最小年齡且 ≤ 99");
  }
  const durationMin = Number(b.durationMin ?? 120);
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 720) {
    return fail("建議停留時間 15-720 分鐘");
  }
  const priceMin = Number(b.priceMin ?? 0);
  const priceMax = Number(b.priceMax ?? 0);
  if (priceMin < 0 || priceMax < 0 || priceMax < priceMin) return fail("價格範圍不對");

  const tags = Array.isArray(b.tags)
    ? Array.from(new Set(b.tags.filter((t) => VALID_TAGS.has(t)).slice(0, 8)))
    : [];

  const photos = Array.isArray(b.photos)
    ? b.photos
        .filter((p): p is string => typeof p === "string" && /^https?:\/\//.test(p))
        .slice(0, 5)
    : [];

  // ─── 速率限制: 每用戶每天最多 5 個 pending 上傳 ──────────────
  // 用 admin 查 (避免 RLS filter 掉 pending 的看不到)
  const admin = createAdminClient();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { count: recentCount } = await admin
    .from("pois")
    .select("id", { count: "exact", head: true })
    .eq("contributor_user_id", user.id)
    .eq("source", "user_upload")
    .gte("created_at", dayAgo);
  if ((recentCount ?? 0) >= 5) {
    return fail("今天已上傳 5 個景點, 24 小時後再上傳更多", 429);
  }

  // ─── ID: ugc_<random> ────────────────────────────────────────
  const id = `ugc_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

  const row = {
    id,
    name,
    category: b.category,
    district: b.district,
    city: b.city,
    address: b.address ?? null,
    age_min: ageMin,
    age_max: ageMax,
    duration_min: durationMin,
    price_min: priceMin,
    price_max: priceMax,
    description: b.description.trim(),
    tags,
    photos,
    phone: b.phone ?? null,
    requires_reservation: b.requiresReservation ?? false,
    source: "user_upload" as const,
    status: "pending" as const,
    contributor_user_id: user.id,
    like_count: 0,
    view_count: 0,
  };

  // 用 admin client 寫入, 繞 RLS.
  // 安全性: 上面已驗證 user (line ~52) + 強制 contributor_user_id = user.id + status='pending'
  // RLS policy 留著當 defense-in-depth (擋直接走 PostgREST anon key 的人)
  const { data, error } = await admin
    .from("pois")
    .insert(row)
    .select("id, name, status")
    .single();

  if (error) {
    return fail(error.message, 500);
  }
  return NextResponse.json({ poi: data });
}
