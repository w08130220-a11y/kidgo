/**
 * Server component, 列出 + 提供留言表單.
 * 直接放進任何 server component 即可.
 */
import { MessageCircle } from "lucide-react";
import { getCommentsFor } from "@/lib/comment-queries";
import { createServerClient } from "@/lib/supabase/server";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

type TargetType = "poi" | "itinerary";

export async function CommentSection({
  targetType,
  targetId,
}: {
  targetType: TargetType;
  targetId: string;
}) {
  const [comments, supabase] = await Promise.all([
    getCommentsFor(targetType, targetId),
    createServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <MessageCircle size={16} />
        留言 ({comments.length})
      </h2>

      {/* 留言表單 (登入才顯示, 未登入給提示) */}
      <div className="mt-4">
        {user ? (
          <CommentForm targetType={targetType} targetId={targetId} />
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-center text-sm text-stone-600">
            <a
              href="/login"
              className="font-semibold text-orange-600 hover:underline"
            >
              登入
            </a>
            {" "}
            後可以分享你的親子體驗
          </div>
        )}
      </div>

      {/* 留言列表 */}
      {comments.length === 0 ? (
        <p className="mt-6 text-center text-sm text-stone-500">
          還沒有人留言, 你來當第一個爸媽分享吧
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
