"use client";

/**
 * 通用按讚按鈕 (POI / itinerary / comment 共用)
 *
 * 特性:
 *   - Optimistic UI (秒響應, 失敗時回滾)
 *   - 未登入點按 → 跳登入 modal (Google + email magic link, 跟其他登入入口一致)
 *   - 兩種顯示: pill (有數字) / icon (只圖示, 給 thumb 列表用)
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cx } from "@/lib/cx";

type TargetType = "poi" | "itinerary" | "comment";
type Variant = "pill" | "icon";

export function LikeButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
  variant = "pill",
  size = "md",
}: {
  targetType: TargetType;
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
  variant?: Variant;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [showLogin, setShowLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    // Optimistic
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    setBusy(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.status === 401) {
        // Rollback + 跳登入
        setLiked(prevLiked);
        setCount(prevCount);
        setShowLogin(true);
        return;
      }
      if (!res.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }
      const json = (await res.json()) as { liked: boolean; count: number };
      // 用 server 真實值 sync (萬一 race)
      setLiked(json.liked);
      setCount(json.count);
      // 重整關聯 server component (例如列表上的 like_count)
      startTransition(() => router.refresh());
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  const iconSize = size === "sm" ? 14 : 16;

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-label={liked ? "取消讚" : "按讚"}
          aria-pressed={liked}
          className={cx(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white transition",
            liked ? "border-rose-300 text-rose-500" : "border-stone-300 text-stone-500 hover:bg-stone-50",
            busy && "opacity-60"
          )}
        >
          <Heart size={iconSize} className={liked ? "fill-rose-500" : ""} />
        </button>
        {showLogin && <LikeLoginPrompt onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={liked ? "取消讚" : "按讚"}
        aria-pressed={liked}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
          liked
            ? "border-rose-300 bg-rose-50 text-rose-600"
            : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
          size === "sm" && "px-2.5 py-1 text-xs",
          busy && "opacity-60"
        )}
      >
        <Heart
          size={iconSize}
          className={cx(
            liked && "fill-rose-500 text-rose-500",
            "transition"
          )}
        />
        <span className="tabular-nums">{count.toLocaleString()}</span>
      </button>
      {showLogin && <LikeLoginPrompt onClose={() => setShowLogin(false)} />}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// 簡化版登入 modal (按讚專用; 全功能版在 /chat 那邊)
// ────────────────────────────────────────────────────────────────────
function LikeLoginPrompt({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleGoogle = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    });
    if (error) {
      setState("error");
      setMsg(`Google 登入失敗: ${error.message}`);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setState("error");
      setMsg("請填有效 email");
      return;
    }
    setState("sending");
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    });
    if (error) {
      setState("error");
      setMsg(error.message);
    } else {
      setState("sent");
      setMsg("登入連結已寄出, 去信箱點連結.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <Heart size={24} className="fill-rose-500 text-rose-500" />
          </div>
          <h3 className="mt-3 text-lg font-bold">按讚需要登入</h3>
          <p className="mt-1 text-sm text-stone-600">登入後可以收藏喜歡的景點與行程</p>
        </div>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.google.com/favicon.ico"
              alt=""
              className="h-4 w-4"
            />
            用 Google 登入
          </button>

          {/* email magic link 暫時關閉, 之後啟用把 false 改 true */}
          {false && (
            <>
              <div className="my-3 flex items-center gap-2 text-xs text-stone-400">
                <div className="h-px flex-1 bg-stone-200" />
                或
                <div className="h-px flex-1 bg-stone-200" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  disabled={state === "sending" || state === "sent"}
                />
                <button
                  type="submit"
                  disabled={state === "sending" || state === "sent"}
                  className={cx(
                    "w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition",
                    state === "sent" ? "bg-emerald-600" : "bg-stone-900 hover:bg-stone-700",
                    state === "sending" && "opacity-60 cursor-wait"
                  )}
                >
                  {state === "sending"
                    ? "寄送中..."
                    : state === "sent"
                      ? "✓ 已寄出"
                      : "寄登入連結"}
                </button>
              </form>
            </>
          )}

          {msg && (
            <p
              className={cx(
                "rounded-lg px-3 py-2 text-xs",
                state === "error"
                  ? "bg-rose-50 text-rose-900"
                  : "bg-emerald-50 text-emerald-900"
              )}
            >
              {msg}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl px-4 py-2 text-sm text-stone-500 hover:bg-stone-100"
        >
          取消
        </button>
      </div>
    </div>
  );
}
