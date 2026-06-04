/**
 * /i/[slug] — 公開分享頁
 * 任何人 (含未登入) 可看. 顯示行程內容 + 「複製成我的」CTA (登入後才能用)
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Eye, Wallet, Sparkles, Bookmark } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PoiImage } from "@/components/PoiImage";
import { createServerClient } from "@/lib/supabase/server";
import { getPoisByIds } from "@/lib/poi-queries";
import { categoryMeta } from "@/lib/mock-data";
import { ShareButtonClient } from "./ShareButtonClient";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentSection } from "@/components/CommentSection";
import { isLikedByUser } from "@/lib/like-queries";
import { isBookmarkedByUser } from "@/lib/bookmark-queries";

const SLOT_LABELS_FULL = ["上午", "中午", "下午", "傍晚", "晚上"];
const SLOT_LABELS_HALF = ["上午", "中午", "下午"];

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("itineraries")
    .select("title, days, estimated_cost")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return { title: "找不到行程 ・ kidgo" };
  return {
    title: `${data.title} ・ kidgo`,
    description: `親子行程：${data.title}, 預估 NT$${(data.estimated_cost ?? 0).toLocaleString()}`,
  };
}

export const dynamic = "force-dynamic";

export default async function SharedItineraryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // 查行程 (profiles 分開查, 因為 itineraries.user_id 是 FK 到 auth.users
  // 不是 profiles, PostgREST 解不出 join)
  const { data: itinerary, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !itinerary) notFound();

  // 另外查作者 profile (用 admin client 繞 RLS, 因為 profile 可能 is_public=false)
  const admin = (await import("@/lib/supabase/server")).createAdminClient();
  const { data: authorProfile } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", itinerary.user_id)
    .maybeSingle();

  // 增加 view_count (fire-and-forget)
  void supabase
    .from("itineraries")
    .update({ view_count: (itinerary.view_count ?? 0) + 1 })
    .eq("id", itinerary.id);

  // 從 days json 拿所有 POI ids
  const daysData = (itinerary.days ?? {}) as {
    days?: { poiIds: string[] }[];
    reasons?: Record<string, string>;
  };
  const days = Array.isArray(daysData.days) ? daysData.days : [];
  const reasons = daysData.reasons ?? {};
  const allIds = days.flatMap((d) => d.poiIds ?? []);
  const pois = await getPoisByIds(allIds);
  const poiMap = new Map(pois.map((p) => [p.id, p]));

  const totalHours = pois.reduce((s, p) => s + p.durationMin, 0) / 60;
  const isHalf = days.length === 1 && days[0].poiIds.length <= 3;
  const slotLabels = isHalf ? SLOT_LABELS_HALF : SLOT_LABELS_FULL;

  const author = authorProfile as
    | { display_name?: string; avatar_url?: string }
    | null;

  const [userLiked, userBookmarked] = await Promise.all([
    isLikedByUser("itinerary", itinerary.id),
    isBookmarkedByUser("itinerary", itinerary.id),
  ]);

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

        {/* Header card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatar_url}
                alt={author.display_name ?? "user"}
                className="h-6 w-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-amber-400 text-[10px] font-bold text-white">
                {(author?.display_name ?? "?")[0]}
              </span>
            )}
            <span className="font-medium text-stone-700">{author?.display_name ?? "匿名爸媽"}</span>
            <span>·</span>
            <span>{new Date(itinerary.created_at).toLocaleDateString("zh-TW")}</span>
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              ★ 公開分享
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            {itinerary.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-stone-100 py-3 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} /> {days.length} 天 · 約 {Math.round(totalHours)} 小時
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet size={14} /> 預估 NT${(itinerary.estimated_cost ?? 0).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={14} /> {(itinerary.view_count ?? 0).toLocaleString()} 看過
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/chat?ref=${itinerary.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 sm:flex-1"
            >
              <Bookmark size={16} /> 複製成我的
            </Link>
            <div className="flex flex-wrap gap-2">
              <BookmarkButton
                targetType="itinerary"
                targetId={itinerary.id}
                initialBookmarked={userBookmarked}
              />
              <LikeButton
                targetType="itinerary"
                targetId={itinerary.id}
                initialLiked={userLiked}
                initialCount={itinerary.like_count ?? 0}
              />
              <ShareButtonClient slug={slug} />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ol className="mt-6 space-y-3">
          {days.map((day, dayIdx) =>
            (day.poiIds ?? []).map((id, slotIdx) => {
              const p = poiMap.get(id);
              if (!p) return null;
              const meta = categoryMeta(p.category);
              const slotKey = `${dayIdx}-${slotIdx}`;
              return (
                <li key={slotKey} className="relative">
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

        <CommentSection targetType="itinerary" targetId={itinerary.id} />

        {/* CTA bottom */}
        <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
          <Sparkles className="mx-auto text-orange-500" size={28} />
          <h2 className="mt-2 text-lg font-bold">想要你自己的客製化行程?</h2>
          <p className="mt-1 text-sm text-stone-600">
            30 秒 AI 規劃，從 5000+ 親子場館挑出最適合你家的
          </p>
          <Link
            href="/chat"
            className="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            開始規劃
          </Link>
        </div>
      </main>
    </>
  );
}

