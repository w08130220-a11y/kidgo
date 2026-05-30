import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PoiCard } from "@/components/PoiCard";
import { pois, type Poi } from "@/lib/mock-data";

export const metadata = {
  title: "探索親子景點 ・ kidgo",
};

// ────────────────────────────────────────────────────────────────────
// Region mapping (city → 區域)
// ────────────────────────────────────────────────────────────────────
const REGION_BY_CITY: Record<string, string> = {
  "基隆市": "北部", "臺北市": "北部", "台北市": "北部", "新北市": "北部",
  "桃園市": "北部", "新竹市": "北部", "新竹縣": "北部", "宜蘭縣": "北部",
  "苗栗縣": "中部", "臺中市": "中部", "台中市": "中部", "彰化縣": "中部",
  "南投縣": "中部", "雲林縣": "中部",
  "嘉義市": "南部", "嘉義縣": "南部", "臺南市": "南部", "台南市": "南部",
  "高雄市": "南部", "屏東縣": "南部",
  "花蓮縣": "東部", "臺東縣": "東部", "台東縣": "東部",
  "澎湖縣": "離島", "金門縣": "離島", "連江縣": "離島", "馬祖": "離島",
};

function poiInRegion(p: Poi, region: string): boolean {
  const text = `${p.address ?? ""} ${p.district ?? ""}`;
  for (const [city, r] of Object.entries(REGION_BY_CITY)) {
    if (text.includes(city) && r === region) return true;
  }
  return false;
}

const REGIONS = ["全部", "北部", "中部", "南部", "東部", "離島"] as const;

const SECONDARY_FILTERS = [
  { key: "free", label: "免費" },
  { key: "outdoor", label: "戶外" },
  { key: "indoor", label: "室內" },
  { key: "rainy", label: "雨天備案" },
  { key: "age03", label: "0-3 歲" },
  { key: "age36", label: "3-6 歲" },
  { key: "age612", label: "6-12 歲" },
] as const;

const PAGE_SIZE = 36;

// ────────────────────────────────────────────────────────────────────
// Filter + sort logic
// ────────────────────────────────────────────────────────────────────
function applyFilters(all: Poi[], filters: {
  region?: string;
  free?: boolean;
  outdoor?: boolean;
  indoor?: boolean;
  rainy?: boolean;
  age03?: boolean;
  age36?: boolean;
  age612?: boolean;
}): Poi[] {
  let out = all;

  // Region (primary)
  if (filters.region && filters.region !== "全部") {
    out = out.filter((p) => poiInRegion(p, filters.region!));
  }

  // Secondary filters (all AND)
  if (filters.free) out = out.filter((p) => p.priceMin === 0 && p.priceMax === 0);
  if (filters.outdoor) out = out.filter((p) =>
    p.tags.some((t) => t.includes("戶外"))
  );
  if (filters.indoor) out = out.filter((p) =>
    p.tags.some((t) => t.includes("室內"))
  );
  if (filters.rainy) out = out.filter((p) =>
    p.tags.some((t) => t.includes("雨天") || t.includes("室內"))
  );
  if (filters.age03) out = out.filter((p) => p.ageMin <= 3);
  if (filters.age36) out = out.filter((p) => p.ageMin <= 6 && p.ageMax >= 3);
  if (filters.age612) out = out.filter((p) => p.ageMax >= 6);

  // Sort by likes desc (rating proxy)
  return [...out].sort((a, b) => b.likes - a.likes);
}

// ────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────
type SearchParams = Promise<{
  region?: string;
  free?: string;
  outdoor?: string;
  indoor?: string;
  rainy?: string;
  age03?: string;
  age36?: string;
  age612?: string;
  page?: string;
}>;

export default async function PoiListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const region = sp.region ?? "全部";
  const flagOn = (k: string) => sp[k as keyof typeof sp] === "1";

  const filters = {
    region,
    free: flagOn("free"),
    outdoor: flagOn("outdoor"),
    indoor: flagOn("indoor"),
    rainy: flagOn("rainy"),
    age03: flagOn("age03"),
    age36: flagOn("age36"),
    age612: flagOn("age612"),
  };

  const filtered = applyFilters(pois, filters);
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const visible = filtered.slice(0, pageNum * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Build URL helper
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "全部") params.set(k, v);
    }
    // 切換 region / filter 重置 page=1
    if (overrides.region !== undefined || Object.keys(overrides).some((k) => k !== "page")) {
      params.delete("page");
    }
    const query = params.toString();
    return query ? `/poi?${query}` : "/poi";
  };

  // 區域分佈統計 (給 region tab 旁顯示數字)
  const countByRegion: Record<string, number> = { 全部: pois.length };
  for (const r of REGIONS.slice(1)) {
    countByRegion[r] = pois.filter((p) => poiInRegion(p, r)).length;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            探索 {pois.length.toLocaleString()}+ 親子景點
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            全台 22 縣市精選親子場館．政府觀光署 + 編輯精選 + 爸媽真實推薦．依評分排序
          </p>
        </div>

        {/* PRIMARY: 區域 tabs */}
        <div className="mb-4 -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
          {REGIONS.map((r) => {
            const active = region === r;
            return (
              <Link
                key={r}
                href={buildUrl({ region: r === "全部" ? undefined : r })}
                className={
                  active
                    ? "flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
                    : "flex shrink-0 items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-400"
                }
              >
                {r}
                <span
                  className={
                    active
                      ? "rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-normal"
                      : "rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-normal text-stone-500"
                  }
                >
                  {countByRegion[r]?.toLocaleString() ?? 0}
                </span>
              </Link>
            );
          })}
        </div>

        {/* SECONDARY: 標籤 chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SECONDARY_FILTERS.map((f) => {
            const active = flagOn(f.key);
            return (
              <Link
                key={f.key}
                href={buildUrl({ [f.key]: active ? undefined : "1" })}
                className={
                  active
                    ? "rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-700 hover:border-orange-300"
                }
              >
                {active ? "✓ " : ""}
                {f.label}
              </Link>
            );
          })}
          {Object.values(filters).some((v) => v && v !== "全部") && (
            <Link
              href="/poi"
              className="rounded-full px-3 py-1 text-xs text-stone-500 underline hover:text-stone-900"
            >
              清除全部
            </Link>
          )}
        </div>

        {/* Count + sort hint */}
        <div className="mb-4 flex items-center justify-between text-xs text-stone-500">
          <span>
            找到 <strong className="text-stone-900">{filtered.length.toLocaleString()}</strong> 個符合，顯示前 {visible.length.toLocaleString()}
          </span>
          <span>按 ♥ 評分高 → 低</span>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <div className="text-5xl">🔍</div>
            <h2 className="mt-4 text-lg font-bold">這個組合沒有結果</h2>
            <p className="mt-2 text-sm text-stone-600">
              換個區域或去掉幾個標籤試試
            </p>
            <Link
              href="/poi"
              className="mt-4 inline-block rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              清除全部 filter
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((poi) => (
              <PoiCard key={poi.id} poi={poi} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-8 text-center">
            <Link
              href={buildUrl({ page: String(pageNum + 1) })}
              className="inline-block rounded-xl bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700"
            >
              看更多 ({(filtered.length - visible.length).toLocaleString()} 個)
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
