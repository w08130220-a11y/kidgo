"use client";

/**
 * /me/itineraries 每列的「公開/取消公開 + 複製連結」
 * 客端負責: 呼叫 publish API → 拿到 slug → 複製連結, 然後 router.refresh()
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, Lock } from "lucide-react";

export function ItineraryShareControls({
  id,
  isPublic: initialIsPublic,
  shareSlug: initialSlug,
}: {
  id: string;
  isPublic: boolean;
  shareSlug: string | null;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string>("");

  const handlePublish = async () => {
    setErr("");
    try {
      const res = await fetch(`/api/itineraries/${id}/publish`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { slug: string };
      setSlug(json.slug);
      setIsPublic(true);
      // 自動複製到剪貼簿
      const url = `${window.location.origin}/i/${json.slug}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // 不彈窗, 等用戶自己點複製
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "公開失敗");
    }
  };

  const handleUnpublish = async () => {
    setErr("");
    if (!window.confirm("確定取消公開? 已分享的連結會無法開啟.")) return;
    try {
      const res = await fetch(`/api/itineraries/${id}/publish`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setIsPublic(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "取消公開失敗");
    }
  };

  const handleCopy = async () => {
    if (!slug) return;
    const url = `${window.location.origin}/i/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("複製這個連結:", url);
    }
  };

  if (isPublic && slug) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleCopy}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            title="複製分享連結"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                已複製
              </>
            ) : (
              <>
                <Copy size={12} />
                複製連結
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleUnpublish}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
            title="取消公開"
          >
            <Lock size={12} />
          </button>
        </div>
        {err && <span className="text-[10px] text-rose-600">{err}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handlePublish}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        title="公開分享"
      >
        <Globe size={12} />
        {pending ? "處理中..." : "公開分享"}
      </button>
      {err && <span className="text-[10px] text-rose-600">{err}</span>}
    </div>
  );
}
