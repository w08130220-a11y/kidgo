import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Wallet, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PoiImage } from "@/components/PoiImage";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentSection } from "@/components/CommentSection";
import { categoryMeta } from "@/lib/mock-data";
import { getPoiById } from "@/lib/poi-queries";
import { isLikedByUser } from "@/lib/like-queries";
import { isBookmarkedByUser } from "@/lib/bookmark-queries";

export default async function PoiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const poi = await getPoiById(id);
  if (!poi) notFound();

  const meta = categoryMeta(poi.category);
  const isFree = poi.priceMin === 0 && poi.priceMax === 0;
  const [userLiked, userBookmarked] = await Promise.all([
    isLikedByUser("poi", poi.id),
    isBookmarkedByUser("poi", poi.id),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/poi"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> 回探索
        </Link>

        <div className="overflow-hidden rounded-3xl shadow-lg">
          <PoiImage
            photo={poi.photos?.[0]}
            gradientClass={meta.gradient}
            emoji={meta.emoji}
            alt={poi.name}
            aspect="aspect-[16/9]"
          >
            <span className="absolute left-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {meta.label}
            </span>
            {isFree && (
              <span className="absolute right-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                免費
              </span>
            )}
          </PoiImage>
        </div>

        {poi.photos && poi.photos.length > 1 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {poi.photos.slice(1, 4).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`${poi.name} 照片 ${i + 2}`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-6">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{poi.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1">
              <MapPin size={15} /> {poi.district}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={15} /> 建議 {Math.round(poi.durationMin / 60)} 小時
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet size={15} />
              {isFree ? "免費" : `NT$${poi.priceMin}–${poi.priceMax}/人`}
            </span>
            <span className="text-stone-500">{poi.ageMin}–{poi.ageMax} 歲</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {poi.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/chat"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 sm:flex-1"
          >
            <Sparkles size={16} /> 加進 AI 行程
          </Link>
          <div className="flex gap-2">
            <BookmarkButton
              targetType="poi"
              targetId={poi.id}
              initialBookmarked={userBookmarked}
            />
            <LikeButton
              targetType="poi"
              targetId={poi.id}
              initialLiked={userLiked}
              initialCount={poi.likes}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold">這個地方</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            {poi.description}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="text-sm font-semibold text-stone-900">爸媽親身體驗</h2>
          <p className="mt-2 italic text-stone-700">「{poi.estimatedKid}」</p>
          <p className="mt-2 text-xs text-stone-500">— {poi.contributorName}</p>
        </div>

        <CommentSection targetType="poi" targetId={poi.id} />
      </main>
    </>
  );
}
