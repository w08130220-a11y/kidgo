"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Phone, MapPin, Clock, Wallet } from "lucide-react";
import { cx } from "@/lib/cx";

type PoiRow = {
  id: string;
  name: string;
  category: string;
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
  contributor_user_id: string | null;
  created_at: string;
};

export function ModerationCard({
  poi,
  contributorName,
}: {
  poi: PoiRow;
  contributorName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [err, setErr] = useState("");
  const [, startTransition] = useTransition();

  const moderate = async (action: "approve" | "reject") => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/pois/${poi.id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setDone(action === "approve" ? "approved" : "rejected");
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "失敗");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <li
        className={cx(
          "rounded-2xl border p-4 text-sm",
          done === "approved"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-stone-200 bg-stone-50 text-stone-600"
        )}
      >
        {done === "approved" ? "✓" : "✗"} {poi.name} — 已{done === "approved" ? "通過" : "退件"}
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">{poi.name}</h3>
          <p className="mt-0.5 text-xs text-stone-500">
            {contributorName} 上傳 · {new Date(poi.created_at).toLocaleString("zh-TW")}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
          {poi.category}
        </span>
      </div>

      {poi.photos && poi.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {poi.photos.slice(0, 3).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={poi.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} /> {poi.city ?? ""} {poi.district}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {poi.duration_min}min
        </span>
        <span className="inline-flex items-center gap-1">
          <Wallet size={12} />
          {poi.price_min === 0 && poi.price_max === 0
            ? "免費"
            : `NT$${poi.price_min}-${poi.price_max}`}
        </span>
        <span>年齡 {poi.age_min}-{poi.age_max} 歲</span>
        {poi.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone size={12} /> {poi.phone}
          </span>
        )}
      </div>

      {poi.address && (
        <p className="mt-2 text-xs text-stone-500">📍 {poi.address}</p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-stone-700">{poi.description}</p>

      {poi.tags && poi.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {poi.tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {err && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {err}
        </p>
      )}

      <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={() => moderate("reject")}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          <X size={14} /> 退件
        </button>
        <button
          type="button"
          onClick={() => moderate("approve")}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check size={14} /> 通過
        </button>
      </div>
    </li>
  );
}
