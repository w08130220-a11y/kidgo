/**
 * Server-side POI queries to Supabase.
 *
 * 為什麼分離:
 *   v1 之前 client component 直接 import 5,532 個 POI (5.5MB bundle).
 *   v1.5 改成: server 查 DB → 只回傳當前需要的 (~36 個 / page).
 *   Client bundle 從 5.5MB → < 200KB.
 *
 * 永遠只在 server (Server Component / API Route) 用. 不要 import 到 client component.
 */
import { createAdminClient } from "@/lib/supabase/server";
import type { Poi, PoiCategory } from "@/lib/mock-data";

// ────────────────────────────────────────────────────────────────────
// City → Region mapping (給 region filter)
// ────────────────────────────────────────────────────────────────────
const REGION_BY_CITY: Record<string, string> = {
  "基隆市": "北部", "臺北市": "北部", "台北市": "北部", "新北市": "北部",
  "桃園市": "北部", "新竹市": "北部", "新竹縣": "北部", "宜蘭縣": "北部",
  "苗栗縣": "中部", "臺中市": "中部", "台中市": "中部", "彰化縣": "中部",
  "南投縣": "中部", "雲林縣": "中部",
  "嘉義市": "南部", "嘉義縣": "南部", "臺南市": "南部", "台南市": "南部",
  "高雄市": "南部", "屏東縣": "南部",
  "花蓮縣": "東部", "臺東縣": "東部", "台東縣": "東部",
  "澎湖縣": "離島", "金門縣": "離島", "連江縣": "離島",
};

function citiesInRegion(region: string): string[] {
  return Object.entries(REGION_BY_CITY)
    .filter(([, r]) => r === region)
    .map(([city]) => city);
}

// ────────────────────────────────────────────────────────────────────
// DB row (snake_case) → Poi (camelCase)
// ────────────────────────────────────────────────────────────────────
type PoiRow = {
  id: string;
  name: string;
  category: PoiCategory;
  district: string;
  city: string | null;
  address: string | null;
  age_min: number;
  age_max: number;
  duration_min: number;
  price_min: number;
  price_max: number;
  description: string | null;
  tags: string[] | null;
  photos: string[] | null;
  phone: string | null;
  requires_reservation: boolean;
  estimated_kid: string | null;
  like_count: number;
  source: string;
};

function rowToPoi(row: PoiRow): Poi {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    district: row.district,
    ageMin: row.age_min,
    ageMax: row.age_max,
    durationMin: row.duration_min,
    priceMin: row.price_min,
    priceMax: row.price_max,
    description: row.description ?? "",
    tags: row.tags ?? [],
    likes: row.like_count ?? 0,
    contributorName: row.source === "hand" ? "編輯精選" : row.source === "seed" ? "編輯精選" : "TDX",
    estimatedKid: row.estimated_kid ?? "",
    phone: row.phone ?? undefined,
    requiresReservation: row.requires_reservation,
    address: row.address ?? undefined,
    photos: row.photos ?? undefined,
  };
}

// ────────────────────────────────────────────────────────────────────
// Query options
// ────────────────────────────────────────────────────────────────────
export type PoiFilters = {
  region?: string;
  category?: PoiCategory;
  city?: string;
  free?: boolean;
  outdoor?: boolean;
  indoor?: boolean;
  rainy?: boolean;
  age03?: boolean;
  age36?: boolean;
  age612?: boolean;
};

export type PoiQueryOpts = PoiFilters & {
  sort?: "likes" | "recent" | "cheap";
  limit?: number;
  offset?: number;
};

// ────────────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────────────
export async function getPois(opts: PoiQueryOpts = {}): Promise<Poi[]> {
  const supabase = createAdminClient(); // read-only public POIs, RLS lets anyone read; admin avoids cookie overhead
  let q = supabase.from("pois").select("*").eq("status", "approved");

  if (opts.region) {
    const cities = citiesInRegion(opts.region);
    if (cities.length > 0) q = q.in("city", cities);
  }
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.free) q = q.eq("price_min", 0).eq("price_max", 0);
  if (opts.outdoor) q = q.contains("tags", ["戶外"]);
  if (opts.indoor) q = q.contains("tags", ["室內"]);
  if (opts.rainy) q = q.overlaps("tags", ["雨天備案", "雨天首選", "室內"]);
  if (opts.age03) q = q.lte("age_min", 3);
  if (opts.age36) q = q.lte("age_min", 6).gte("age_max", 3);
  if (opts.age612) q = q.gte("age_max", 6);

  // Sort
  const sort = opts.sort ?? "likes";
  if (sort === "likes") q = q.order("like_count", { ascending: false });
  else if (sort === "recent") q = q.order("created_at", { ascending: false });
  else if (sort === "cheap") q = q.order("price_min", { ascending: true });

  // Pagination
  const limit = opts.limit ?? 36;
  const offset = opts.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) {
    console.error("getPois error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToPoi(r as PoiRow));
}

/** 取得 filter 後總數 (給 paginate UI 顯示 'X / Y') */
export async function countPois(opts: PoiFilters = {}): Promise<number> {
  const supabase = createAdminClient();
  let q = supabase.from("pois").select("*", { count: "exact", head: true }).eq("status", "approved");

  if (opts.region) {
    const cities = citiesInRegion(opts.region);
    if (cities.length > 0) q = q.in("city", cities);
  }
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.free) q = q.eq("price_min", 0).eq("price_max", 0);
  if (opts.outdoor) q = q.contains("tags", ["戶外"]);
  if (opts.indoor) q = q.contains("tags", ["室內"]);
  if (opts.rainy) q = q.overlaps("tags", ["雨天備案", "雨天首選", "室內"]);
  if (opts.age03) q = q.lte("age_min", 3);
  if (opts.age36) q = q.lte("age_min", 6).gte("age_max", 3);
  if (opts.age612) q = q.gte("age_max", 6);

  const { count } = await q;
  return count ?? 0;
}

/** 計算各 region 的 POI 數量 (給探索頁的 tab 數字) */
export async function countByRegion(): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pois")
    .select("city")
    .eq("status", "approved");
  if (error || !data) return { 全部: 0, 北部: 0, 中部: 0, 南部: 0, 東部: 0, 離島: 0 };

  const out: Record<string, number> = { 全部: data.length, 北部: 0, 中部: 0, 南部: 0, 東部: 0, 離島: 0 };
  for (const r of data) {
    const city = (r as { city: string | null }).city;
    if (!city) continue;
    const region = REGION_BY_CITY[city];
    if (region) out[region] = (out[region] ?? 0) + 1;
  }
  return out;
}

export async function getPoiById(id: string): Promise<Poi | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pois")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();
  if (error || !data) return null;
  return rowToPoi(data as PoiRow);
}

export async function getPoisByIds(ids: string[]): Promise<Poi[]> {
  if (ids.length === 0) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pois")
    .select("*")
    .in("id", ids)
    .eq("status", "approved");
  if (error || !data) return [];
  const map = new Map((data as PoiRow[]).map((r) => [r.id, rowToPoi(r)]));
  // Preserve original order
  return ids.map((id) => map.get(id)).filter((p): p is Poi => Boolean(p));
}

/** 給「換一個」按鈕用: 同 category, 排除 used, 符合年齡 → 隨機回一個 */
export async function getSwapCandidate(opts: {
  category: PoiCategory;
  excludeIds: string[];
  minAge: number;
  maxAge: number;
}): Promise<Poi | null> {
  const supabase = createAdminClient();
  let q = supabase
    .from("pois")
    .select("*")
    .eq("status", "approved")
    .eq("category", opts.category)
    .lte("age_min", opts.maxAge)
    .gte("age_max", opts.minAge)
    .limit(50);

  if (opts.excludeIds.length > 0) {
    q = q.not("id", "in", `(${opts.excludeIds.map((id) => `"${id}"`).join(",")})`);
  }

  const { data, error } = await q;
  if (error || !data || data.length === 0) return null;

  // Random pick from top 50 candidates
  const pick = data[Math.floor(Math.random() * data.length)];
  return rowToPoi(pick as PoiRow);
}
