/**
 * /admin/feedback — 反饋管理
 * 預設只顯示 status='open', 可切 tab 看其他狀態
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { FeedbackItem } from "./FeedbackItem";

export const metadata = { title: "用戶反饋 ・ kidgo admin" };
export const dynamic = "force-dynamic";

function isAdmin(userId: string): boolean {
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(userId);
}

const STATUS_TABS = [
  { key: "open", label: "新訊息", color: "amber" },
  { key: "in_progress", label: "處理中", color: "blue" },
  { key: "resolved", label: "已解決", color: "emerald" },
  { key: "closed", label: "已關閉", color: "stone" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (STATUS_TABS.find((t) => t.key === sp.status)?.key ??
    "open") as StatusKey;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/feedback");
  if (!isAdmin(user.id)) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold">無權限</h1>
        </main>
      </>
    );
  }

  const admin = createAdminClient();

  // 各 status 的 count, 給 tab 上顯示數字
  const counts: Record<StatusKey, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  for (const tab of STATUS_TABS) {
    const { count } = await admin
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", tab.key);
    counts[tab.key] = count ?? 0;
  }

  // 取當前 tab 的訊息
  const { data: feedbackList } = await admin
    .from("feedback")
    .select(
      "id, user_id, email, category, body, url, user_agent, status, admin_note, resolved_at, created_at"
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">用戶反饋</h1>
        <p className="mt-2 text-sm text-stone-600">
          看用戶想跟你說什麼, 一則一則回覆 / 標記處理狀態.
        </p>

        {/* Status tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/admin/feedback?status=${tab.key}`}
                className={
                  active
                    ? "flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-sm font-semibold text-white"
                    : "flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                }
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span
                    className={
                      active
                        ? "rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-normal"
                        : "rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-normal text-stone-600"
                    }
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {(feedbackList ?? []).length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <div className="text-5xl">📭</div>
            <h2 className="mt-4 text-lg font-bold">
              {status === "open" ? "沒新訊息" : "這邊空空的"}
            </h2>
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {(feedbackList ?? []).map((f) => (
            <FeedbackItem key={f.id} feedback={f} />
          ))}
        </ul>
      </main>
    </>
  );
}
