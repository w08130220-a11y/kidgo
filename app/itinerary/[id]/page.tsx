/**
 * /itinerary/[id] — 行程詳細頁
 *
 * 處理 2 種情境:
 *   1. UUID = DB 內用戶儲存的真實行程
 *      - 公開的 → 任何人可看
 *      - 私密的 → 只有 owner 可看
 *   2. 其他字串 (例 it_001) = mock-data 內 demo 行程 → 任何人可看
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Heart, Sparkles, MapPin, Clock, Wallet, Eye, Calendar } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PoiImage } from "@/components/PoiImage";
import { getItinerary, categoryMeta } from "@/lib/mock-data";
import { getPoisByIds } from "@/lib/poi-queries";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

const SLOT_LABELS_FULL = ["上午", "中午", "下午", "傍晚", "晚上"];
const SLOT_LABELS_HALF = ["上午", "中午", "下午"];

// UUID 簡單驗證 (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export default async function ItineraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ─── Case A: UUID = DB 真實行程 ───────────────────────────────────
  if (isUuid(id)) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const { data: it } = await admin
      .from("itineraries")
      .select(
        "id, user_id, title, days, estimated_cost, is_public, share_slug, like_count, view_count, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (!it) notFound();

    // 權限: 公開的任何人可看; 私密的只 owner
    const itTyped = it as {
      id: string;
      user_id: string;
      title: string;
      days: { days?: { poiIds?: string[] }[]; reasons?: Record<string, string> } | null;
      estimated_cost: number;
      is_public: boolean;
      share_slug: string | null;
      like_count: number;
      view_count: number;
      created_at: string;
    };
    const isOwner = user?.id === itTyped.user_id;
    if (!itTyped.is_public && !isOwner) {
      notFound();
    }

    // 公開的就 redirect 去 /i/[slug] (那邊 UI 更完整, 含 view_count +1 等)
    if (itTyped.is_public && itTyped.share_slug && !isOwner) {
      redirect(`/i/${itTyped.share_slug}`);
    }

    const daysData = itTyped.days ?? {};
    const days = Array.isArray(daysData.days) ? daysData.days : [];
    const reasons = daysData.reasons ?? {};
    const allIds = days.flatMap((d) => d.poiIds ?? []);
    const pois = await getPoisByIds(allIds);
    const poiMap = new Map(pois.map((p) => [p.id, p]));

    const totalHours = pois.reduce((s, p) => s + p.durationMin, 0) / 60;
    const isHalf = days.length === 1 && (days[0].poiIds?.length ?? 0) <= 3;
    const slotLabels = isHalf ? SLOT_LABELS_HALF : SLOT_LABELS_FULL;

    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Link
            href={isOwner ? "/me/itineraries" : "/"}
            className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft size={14} /> {isOwner ? "回我的行程" : "回首頁"}
          </Link>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              {itTyped.is_public ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                  ★ 公開分享
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-600">
                  🔒 私密
                </span>
              )}
              <span>·</span>
              <span>{new Date(itTyped.created_at).toLocaleDateString("zh-TW")}</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
              {itTyped.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-stone-100 py-3 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} /> {days.length} 天 · 約 {Math.round(totalHours)} 小時
              </span>
              <span className="inline-flex items-center gap-1">
                <Wallet size={14} /> 預估 NT${itTyped.estimated_cost.toLocaleString()}
              </span>
              {(itTyped.view_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Eye size={14} /> {itTyped.view_count.toLocaleString()} 看過
                </span>
              )}
              {(itTyped.like_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Heart size={14} className="fill-rose-400 text-rose-400" /> {itTyped.like_count}
                </span>
              )}
            </div>

            {isOwner && !itTyped.is_public && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                💡 這是你的私密行程, 只有你看得到. 想分享給朋友? 去
                <Link href="/me/itineraries" className="ml-1 font-semibold underline">
                  我的行程
                </Link>
                按「公開分享」可生成連結.
              </div>
            )}
          </div>

          {/* Timeline */}
          <ol className="mt-6 space-y-3">
            {days.map((day, dayIdx) =>
              (day.poiIds ?? []).map((pid, slotIdx) => {
                const p = poiMap.get(pid);
                if (!p) return null;
                const meta = categoryMeta(p.category);
                const slotKey = `${dayIdx}-${slotIdx}`;
                return (
                  <li key={slotKey}>
                    <Link
                      href={`/poi/${p.id}`}
                      className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-500">
                          {days.length > 1 && `Day${dayIdx + 1}-`}
                          {slotLabels[slotIdx] ?? `Stop ${slotIdx + 1}`}
                        </span>
                        <div className="overflow-hidden rounded-2xl">
                          <PoiImage
                            photo={p.photos?.[0]}
                            gradientClass={meta.gradient}
                            emoji={meta.emoji}
                            alt={p.name}
                            aspect="aspect-square w-14"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold leading-snug">{p.name}</h3>
                        <p className="mt-1 text-xs text-stone-500">
                          {p.district} · {Math.round(p.durationMin / 60)}h ·{" "}
                          {p.priceMin === 0 && p.priceMax === 0
                            ? "免費"
                            : `NT$${p.priceMin}+`}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-stone-700">
                          {p.description}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ol>

          {/* Unused: reasons (從 daysData 來), 保留沒拿掉以後可加回 */}
          {reasons && Object.keys(reasons).length === 0 && null}
        </main>
      </>
    );
  }

  // ─── Case B: 非 UUID → mock-data demo 行程 ────────────────────────
  const it = getItinerary(id);
  if (!it) notFound();

  const items = await getPoisByIds(it.poiIds);
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

          <div className="mt-4">
            <Link
              href="/chat"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <Sparkles size={16} /> 用 AI 規劃我家的行程
            </Link>
            <p className="mt-2 text-center text-xs text-stone-500">
              這是其他爸媽的行程, 給你當靈感 ✨ 你的家庭條件不同, AI 會為你客製
            </p>
          </div>
        </div>

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
                      {SLOT_LABELS_FULL[i] ?? `Stop ${i + 1}`}
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
