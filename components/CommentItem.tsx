"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Baby } from "lucide-react";
import { LikeButton } from "./LikeButton";
import type { CommentWithAuthor } from "@/lib/comment-queries";

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "剛剛";
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-TW");
}

export function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const handleDelete = async () => {
    if (busy) return;
    if (!window.confirm("確定刪除這則留言?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `HTTP ${res.status}`);
      }
      setDeleted(true);
      startTransition(() => router.refresh());
    } catch (e) {
      alert(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setBusy(false);
    }
  };

  if (deleted) return null;

  return (
    <li className="flex gap-3">
      {comment.authorAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-amber-400 text-sm font-bold text-white">
          {comment.authorName[0]}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-stone-800">
            {comment.authorName}
          </span>
          {comment.ageWhenVisited !== null && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              <Baby size={10} /> 帶 {comment.ageWhenVisited} 歲去
            </span>
          )}
          <span className="text-xs text-stone-500">
            {relativeTime(comment.createdAt)}
          </span>
          {comment.isOwn && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="ml-auto text-stone-400 hover:text-rose-600"
              aria-label="刪除"
              title="刪除"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
          {comment.body}
        </p>
        <div className="mt-1.5">
          <LikeButton
            targetType="comment"
            targetId={comment.id}
            initialLiked={comment.isLiked}
            initialCount={comment.likeCount}
            variant="pill"
            size="sm"
          />
        </div>
      </div>
    </li>
  );
}
