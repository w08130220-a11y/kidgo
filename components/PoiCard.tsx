import Link from "next/link";
import { Heart, MapPin, Clock } from "lucide-react";
import { type Poi, categoryMeta } from "@/lib/mock-data";

export function PoiCard({ poi, compact = false }: { poi: Poi; compact?: boolean }) {
  const meta = categoryMeta(poi.category);
  const priceLabel =
    poi.priceMin === 0 && poi.priceMax === 0
      ? "免費"
      : `NT$${poi.priceMin}${poi.priceMax !== poi.priceMin ? `–${poi.priceMax}` : ""}/人`;

  return (
    <Link
      href={`/poi/${poi.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${meta.gradient} text-white`}
      >
        <span className="text-6xl drop-shadow-md">{meta.emoji}</span>
        <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
          {meta.label}
        </span>
        {poi.priceMin === 0 && poi.priceMax === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">
            免費
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold leading-snug">
          {poi.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {poi.district}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {Math.round(poi.durationMin / 60)} 小時
          </span>
          <span>{poi.ageMin}–{poi.ageMax} 歲</span>
        </div>

        {!compact && (
          <p className="line-clamp-2 text-sm text-stone-600">{poi.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-medium text-stone-900">{priceLabel}</span>
          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
            <Heart size={12} className="fill-rose-400 text-rose-400" />
            {poi.likes.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
