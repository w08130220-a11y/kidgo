"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bug, Lightbulb, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { cx } from "@/lib/cx";

type Feedback = {
  id: string;
  user_id: string | null;
  email: string | null;
  category: string;
  body: string;
  url: string | null;
  user_agent: string | null;
  status: string;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: "Bug", icon: <Bug size={12} />, color: "bg-rose-100 text-rose-700" },
  feature: { label: "新功能", icon: <Lightbulb size={12} />, color: "bg-amber-100 text-amber-700" },
  praise: { label: "稱讚", icon: <Heart size={12} />, color: "bg-pink-100 text-pink-700" },
  other: { label: "其他", icon: <MessageCircle size={12} />, color: "bg-stone-100 text-stone-700" },
};

const STATUS_OPTIONS = [
  { value: "open", label: "新訊息" },
  { value: "in_progress", label: "處理中" },
  { value: "resolved", label: "已解決" },
  { value: "closed", label: "已關閉" },
];

export function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const router = useRouter();
  const [status, setStatus] = useState(feedback.status);
  const [note, setNote] = useState(feedback.admin_note ?? "");
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState("");
  const [, startTransition] = useTransition();

  const meta = CATEGORY_META[feedback.category] ?? CATEGORY_META.other;

  const update = async (changes: { status?: string; admin_note?: string }) => {
    setSavingState("saving");
    setErr("");
    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `HTTP ${res.status}`);
      }
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 2000);
      startTransition(() => router.refresh());
    } catch (e) {
      setSavingState("error");
      setErr(e instanceof Error ? e.message : "更新失敗");
    }
  };

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* 標籤 + 時間 */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            meta.color
          )}
        >
          {meta.icon}
          {meta.label}
        </span>
        <span className="text-xs text-stone-500">
          {new Date(feedback.created_at).toLocaleString("zh-TW")}
        </span>
        {feedback.email && (
          <a
            href={`mailto:${feedback.email}`}
            className="ml-auto text-xs text-stone-500 hover:text-orange-600 hover:underline"
          >
            {feedback.email}
          </a>
        )}
      </div>

      {/* 內容 */}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
        {feedback.body}
      </p>

      {/* 來源 URL + UA */}
      {(feedback.url || feedback.user_agent) && (
        <div className="mt-3 space-y-1 text-[11px] text-stone-400">
          {feedback.url && (
            <p>
              來自:{" "}
              <a
                href={feedback.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 break-all hover:text-stone-700 hover:underline"
              >
                {feedback.url} <ExternalLink size={10} />
              </a>
            </p>
          )}
          {feedback.user_agent && (
            <p className="truncate" title={feedback.user_agent}>
              裝置: {feedback.user_agent}
            </p>
          )}
        </div>
      )}

      {/* Admin 控制 */}
      <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
        {/* status */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-stone-600">狀態</label>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setStatus(s.value);
                update({ status: s.value });
              }}
              className={cx(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                status === s.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* admin note */}
        <div>
          <label className="block text-xs font-medium text-stone-600">
            內部筆記 (用戶看不到)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (feedback.admin_note ?? "")) {
                update({ admin_note: note });
              }
            }}
            rows={2}
            placeholder="例如: 已聯絡用戶 / 已修 commit abc123 / 之後處理"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-xs outline-none focus:border-orange-400"
          />
        </div>

        {savingState === "saving" && (
          <p className="text-xs text-stone-500">儲存中...</p>
        )}
        {savingState === "saved" && (
          <p className="text-xs text-emerald-600">✓ 已更新</p>
        )}
        {err && <p className="text-xs text-rose-600">{err}</p>}
      </div>
    </li>
  );
}
