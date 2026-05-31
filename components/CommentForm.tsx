"use client";

/**
 * 留言表單 (client). textarea + 「我帶 X 歲去」optional.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { cx } from "@/lib/cx";

type TargetType = "poi" | "itinerary";

export function CommentForm({
  targetType,
  targetId,
}: {
  targetType: TargetType;
  targetId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [withAge, setWithAge] = useState(false);
  const [age, setAge] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !body.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          body: body.trim(),
          ageWhenVisited: withAge ? age : null,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `HTTP ${res.status}`);
      }
      setBody("");
      setWithAge(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="分享你的親子體驗 (例: 帶 3 歲去, 玩了 2 小時, 旁邊有遮陽)..."
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none transition focus:border-orange-400"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={withAge}
              onChange={(e) => setWithAge(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            我帶
          </label>
          {withAge && (
            <select
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs"
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          )}
          {withAge && <span className="text-xs text-stone-600">歲去</span>}
          <span className="ml-auto text-[10px] text-stone-400">
            {body.length}/500
          </span>
        </div>
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700",
            (busy || !body.trim()) && "opacity-50 cursor-not-allowed"
          )}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={14} /> 送出中
            </>
          ) : (
            <>
              <Send size={14} /> 留言
            </>
          )}
        </button>
      </div>
      {err && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {err}
        </p>
      )}
    </form>
  );
}
