"use client";

import { useState } from "react";
import { Bug, Lightbulb, Heart, MessageCircle, Send, Loader2, Check } from "lucide-react";
import { cx } from "@/lib/cx";

type Category = "bug" | "feature" | "praise" | "other";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "bug", label: "回報 Bug", icon: <Bug size={16} />, desc: "看到出錯或網站怪怪的" },
  { value: "feature", label: "希望加功能", icon: <Lightbulb size={16} />, desc: "有想要的新功能" },
  { value: "praise", label: "稱讚 / 心得", icon: <Heart size={16} />, desc: "用得開心想跟我們說" },
  { value: "other", label: "其他", icon: <MessageCircle size={16} />, desc: "都不是以上" },
];

export function FeedbackForm({
  userEmail,
  isLoggedIn,
}: {
  userEmail: string | null;
  isLoggedIn: boolean;
}) {
  const [category, setCategory] = useState<Category>("feature");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState(userEmail ?? "");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending" || state === "sent") return;
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          body: body.trim(),
          email: email.trim() || undefined,
          url: window.location.href,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `HTTP ${res.status}`);
      }
      setState("sent");
      setMsg("謝謝你的回饋, 我們收到了");
      setBody("");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "送出失敗, 稍後再試");
    }
  };

  if (state === "sent") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <Check size={48} className="mx-auto text-emerald-600" />
        <h2 className="mt-3 text-xl font-bold text-emerald-900">{msg}</h2>
        <p className="mt-2 text-sm text-emerald-800">
          我們會看每一則訊息. 若有需要回覆, 會用你提供的 email 聯絡你.
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setMsg("");
          }}
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          再給一則建議
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* 類別 */}
      <div>
        <label className="block text-sm font-semibold text-stone-800">類型</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cx(
                "flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition",
                category === c.value
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
              )}
            >
              {c.icon}
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-stone-500">
          {CATEGORIES.find((c) => c.value === category)?.desc}
        </p>
      </div>

      {/* 內容 */}
      <div>
        <label className="block text-sm font-semibold text-stone-800">
          想跟我們說什麼 <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minLength={5}
          maxLength={2000}
          rows={6}
          placeholder={
            category === "bug"
              ? "什麼裝置 / 瀏覽器? 在哪個頁面? 點了什麼之後出錯?"
              : category === "feature"
                ? "想要什麼功能? 為什麼想要?"
                : category === "praise"
                  ? "什麼地方覺得讚?"
                  : "聽聽看你的想法..."
          }
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none transition focus:border-orange-400"
        />
        <div className="mt-1 text-right text-xs text-stone-400">{body.length} / 2000</div>
      </div>

      {/* Email (登入過自動填) */}
      <div>
        <label className="block text-sm font-semibold text-stone-800">
          Email (可空, 給我們聯絡你)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
        />
        {isLoggedIn && (
          <p className="mt-1 text-xs text-stone-500">
            已用你登入的 email 帶上, 想換可以改.
          </p>
        )}
      </div>

      {/* 提交 */}
      {state === "error" && msg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-6">
        <p className="text-xs text-stone-500">每小時最多 5 則.</p>
        <button
          type="submit"
          disabled={state === "sending" || body.length < 5}
          className={cx(
            "inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600",
            (state === "sending" || body.length < 5) && "opacity-50 cursor-not-allowed"
          )}
        >
          {state === "sending" ? (
            <>
              <Loader2 size={16} className="animate-spin" /> 送出中
            </>
          ) : (
            <>
              <Send size={16} /> 送出
            </>
          )}
        </button>
      </div>
    </form>
  );
}
