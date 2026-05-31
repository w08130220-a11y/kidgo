import Link from "next/link";
import { Sparkles, Heart, Eye, ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PoiCard } from "@/components/PoiCard";
import { itineraries } from "@/lib/mock-data";
import { getPois, getPoisByIds, countPois } from "@/lib/poi-queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredItineraries = itineraries.slice(0, 3);
  // Fetch top 6 popular POIs + all POIs used by demo itineraries (for mini preview cards)
  const allDemoIds = Array.from(
    new Set(featuredItineraries.flatMap((it) => it.poiIds))
  );
  const [featuredPois, demoPois, totalCount] = await Promise.all([
    getPois({ limit: 6, sort: "likes", prioritizePhoto: true }),
    getPoisByIds(allDemoIds),
    countPois(),
  ]);
  const demoPoiMap = new Map(demoPois.map((p) => [p.id, p]));
  const getDemoPoi = (id: string) => demoPoiMap.get(id);

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-orange-50 via-stone-50 to-stone-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700">
            <Sparkles size={12} /> 全台 22 縣市 ・ AI 即時規劃
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-6xl">
            全台親子行程，<br className="sm:hidden" />
            <span className="text-orange-600">30 秒</span>規劃完成。
          </h1>
          <p className="mt-5 text-base text-stone-600 sm:text-lg">
            告訴 AI 孩子幾歲、預算多少、想戶外/室內/動物/學習 ...
            <br className="hidden sm:block" />
            從北到南、從半日到 3 天 2 夜，一鍵生出完整行程含餐廳與費用。
          </p>

          {/* CTA */}
          <div className="mx-auto mt-8 flex flex-col items-center">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg sm:text-lg"
            >
              <Sparkles size={20} /> 開始規劃 <ArrowRight size={18} />
            </Link>
            <p className="mt-4 text-xs text-stone-500">
              全台 22 縣市 {totalCount.toLocaleString()}+ 親子場館．AI 不會給你不存在的景點．30 秒完成
            </p>
          </div>
        </div>
      </section>

      {/* Featured Itineraries */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            本週熱門行程
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            其他爸媽公開的行程，可一鍵複製成你的
          </p>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {featuredItineraries.map((it) => {
            const itPois = it.poiIds
              .map((id) => getDemoPoi(id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            return (
              <Link
                key={it.id}
                href={`/itinerary/${it.id}`}
                className="group flex w-[calc(100vw-2rem)] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto sm:shrink"
              >
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5">
                    {it.authorName}
                  </span>
                  <span>·</span>
                  <span>{it.createdAt}</span>
                </div>
                <h3 className="text-lg font-semibold leading-snug group-hover:text-orange-600">
                  {it.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {it.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  {itPois.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 truncate rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs text-stone-700"
                    >
                      <span className="text-base leading-none">
                        {categoryEmoji(p.category)}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
                  <span className="font-semibold text-stone-900">
                    {it.estimatedCost === 0
                      ? "免費"
                      : `預估 NT$${it.estimatedCost.toLocaleString()}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Heart size={12} className="fill-rose-400 text-rose-400" />
                      {it.likes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={12} /> {it.views.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured POIs */}
      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                新加入的親子景點
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                由爸媽親自走過、推薦給你
              </p>
            </div>
            <Link
              href="/poi"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              看全部 {totalCount.toLocaleString()}+ →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPois.map((poi) => (
              <PoiCard key={poi.id} poi={poi} />
            ))}
          </div>

          {/* 大顆 CTA: 看更多景點 */}
          <div className="mt-6 text-center">
            <Link
              href="/poi"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 sm:text-base"
            >
              探索全部 {totalCount.toLocaleString()}+ 景點 <ArrowRight size={16} />
            </Link>
          </div>

          {/* UGC 上傳 CTA */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
            <p className="text-sm font-semibold text-stone-700">
              知道一個還沒上的好地方？
            </p>
            <p className="mt-1 text-xs text-stone-500">
              幫其他爸媽補上系統還沒收的好景點．通過審核後全站可見
            </p>
            <Link
              href="/poi/new"
              className="mt-3 inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-700"
            >
              + 推薦一個景點
            </Link>
          </div>
        </div>
      </section>

      {/* 本月貢獻王 + 賺積分 — 暫時隱藏 (積分系統 v1 未實作, schema 已預留) */}

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-stone-500 sm:flex-row">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="kidgo" className="h-6 w-6" />
              <span className="font-bold text-stone-700">kidgo</span>
              <span>·</span>
              <span>© 2026 全台親子・30 秒規劃</span>
            </div>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-stone-900">隱私政策</Link>
              <Link href="/terms" className="hover:text-stone-900">服務條款</Link>
              <a href="mailto:w13081308@gmail.com" className="hover:text-stone-900">給我們建議</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function categoryEmoji(c: string): string {
  const map: Record<string, string> = {
    park: "🌳",
    museum: "🏛️",
    restaurant: "🍽️",
    zoo: "🦁",
    amusement: "🎡",
    indoor: "🎨",
  };
  return map[c] ?? "📍";
}
