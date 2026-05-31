import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PoiCard } from "@/components/PoiCard";
import { getPois, countPois, countByRegion } from "@/lib/poi-queries";

export const metadata = {
  title: "探索親子景點 ・ kidgo",
};

export const dynamic = "force-dynamic";

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

  const filterOpts = {
    region: region === "全部" ? undefined : region,
    free: flagOn("free"),
    outdoor: flagOn("outdoor"),
    indoor: flagOn("indoor"),
    rainy: flagOn("rainy"),
    age03: flagOn("age03"),
    age36: flagOn("age36"),
    age612: flagOn("age612"),
  };

  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = pageNum * PAGE_SIZE; // Load top N (so prev pages also show)

  const [visible, totalMatching, byRegion] = await Promise.all([
    getPois({ ...filterOpts, limit, sort: "likes" }),
    countPois(filterOpts),
    countByRegion(),
  ]);

  const hasMore = visible.length < totalMatching;

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "全部") params.set(k, v);
    }
    if (overrides.region !== undefined || Object.keys(overrides).some((k) => k !== "page")) {
      params.delete("page");
    }
    const query = params.toString();
    return query ? `/poi?${query}` : "/poi";
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            探索 {byRegion["全部"]?.toLocaleString() ?? 0}+ 親子景點
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            全台 22 縣市．政府觀光署 + 編輯精選 + 爸媽推薦．依評分排序
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
                  {byRegion[r]?.toLocaleString() ?? 0}
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
          {(region !== "全部" || SECONDARY_FILTERS.some((f) => flagOn(f.key))) && (
            <Link
              href="/poi"
              className="rounded-full px-3 py-1 text-xs text-stone-500 underline hover:text-stone-900"
            >
              清除全部
            </Link>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-stone-500">
          <span>
            找到 <strong className="text-stone-900">{totalMatching.toLocaleString()}</strong> 個符合，顯示前 {visible.length.toLocaleString()}
          </span>
          <span>按 ♥ 評分高 → 低</span>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <div className="text-5xl">🔍</div>
            <h2 className="mt-4 text-lg font-bold">這個組合沒有結果</h2>
            <p className="mt-2 text-sm text-stone-600">換個區域或去掉幾個標籤試試</p>
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

        {hasMore && (
          <div className="mt-8 text-center">
            <Link
              href={buildUrl({ page: String(pageNum + 1) })}
              className="inline-block rounded-xl bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700"
            >
              看更多 ({(totalMatching - visible.length).toLocaleString()} 個)
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
