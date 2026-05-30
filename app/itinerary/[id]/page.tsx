import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Share2, Bookmark, MapPin, Clock, Wallet, Eye } from "lucide-react";
import { Nav } from "@/components/Nav";
import { getItinerary, getPoi, categoryMeta } from "@/lib/mock-data";

const SLOT_LABELS = ["早午餐", "上午景點", "點心 / 午茶", "下午景點", "晚餐"];

export default async function ItineraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const it = getItinerary(id);
  if (!it) notFound();

  const items = it.poiIds
    .map((pid) => getPoi(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const totalHours = Math.round(items.reduce((s, p) => s + p.durationMin, 0) / 60);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> 回首頁
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
              {it.authorName}
            </span>
            <span>·</span>
            <span>{it.authorPoints.toLocaleString()} 積分</span>
            <span>·</span>
            <span>{it.createdAt}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            {it.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {it.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
              >
                #{t}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-stone-100 py-3 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1">
              <Clock size={14} /> 約 {totalHours} 小時
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet size={14} /> 預估 NT${it.estimatedCost.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={14} /> {it.views.toLocaleString()} 看過
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={14} className="fill-rose-400 text-rose-400" /> {it.likes} 讚
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
              <Bookmark size={16} /> 複製成我的
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              <Heart size={16} />
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              <Share2 size={16} />
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-xs text-stone-600">
            <span className="font-semibold text-stone-900">原始 query：</span>「{it.query}」
          </div>
        </div>

        {/* Itinerary timeline */}
        <ol className="mt-6 space-y-3">
          {items.map((p, i) => {
            const meta = categoryMeta(p.category);
            return (
              <li key={`${p.id}-${i}`} className="relative">
                {i < items.length - 1 && (
                  <span className="absolute left-[27px] top-[88px] h-[calc(100%-72px)] w-0.5 bg-stone-200" />
                )}
                <Link
                  href={`/poi/${p.id}`}
                  className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-500">
                      {SLOT_LABELS[i] ?? `Stop ${i + 1}`}
                    </span>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-3xl text-white shadow`}
                    >
                      {meta.emoji}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold leading-snug">{p.name}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-0.5"><MapPin size={11} /> {p.district}</span>
                      <span className="inline-flex items-center gap-0.5"><Clock size={11} /> {Math.round(p.durationMin / 60)}h</span>
                      <span>{p.ageMin}-{p.ageMax} 歲</span>
                    </p>
                    <p className="mt-2 text-sm text-stone-700">{p.description}</p>
                    <p className="mt-2 text-xs italic text-stone-500">
                      「{p.estimatedKid}」— {p.contributorName}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
