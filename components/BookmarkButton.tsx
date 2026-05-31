"use client";

/**
 * 收藏按鈕 (想去清單). 跟 LikeButton 視覺上有區分:
 *   - Like = 紅色 ❤
 *   - Bookmark = 黃色 🔖 (BookmarkPlus / Bookmark filled)
 *
 * 點下 → toggle. 未登入跳登入 modal.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cx } from "@/lib/cx";

type TargetType = "poi" | "itinerary";

export function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked,
}: {
  targetType: TargetType;
  targetId: string;
  initialBookmarked: boolean;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const prev = bookmarked;
    setBookmarked(!prev);
    setBusy(true);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.status === 401) {
        setBookmarked(prev);
        // 跳登入頁帶 next= 回原頁
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }
      if (!res.ok) {
        setBookmarked(prev);
        return;
      }
      const json = (await res.json()) as { bookmarked: boolean };
      setBookmarked(json.bookmarked);
    } catch {
      setBookmarked(prev);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={bookmarked ? "從想去清單移除" : "加進想去清單"}
      aria-pressed={bookmarked}
      title={bookmarked ? "已加進想去 (點一下移除)" : "加進想去"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-medium transition",
        bookmarked
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
        busy && "opacity-60"
      )}
    >
      {bookmarked ? (
        <>
          <BookmarkCheck size={16} className="fill-amber-500 text-amber-500" />
          <span className="hidden sm:inline">想去</span>
        </>
      ) : (
        <>
          <Bookmark size={16} />
          <span className="hidden sm:inline">想去</span>
        </>
      )}
    </button>
  );
}
