/**
 * /admin — Dashboard 首頁
 * 顯示用戶數、內容統計、最近註冊用戶
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  MapPin,
  Bookmark,
  Heart,
  MessageCircle,
  Bookmark as BookmarkIcon,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminStats } from "@/lib/admin-stats";

export const metadata = { title: "Dashboard ・ kidgo admin" };
export const dynamic = "force-dynamic";

function isAdmin(userId: string): boolean {
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(userId);
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "剛剛";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-TW");
}

export default async function AdminDashboard() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user.id)) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold">無權限</h1>
          <p className="mt-2 text-sm text-stone-600">
            此頁僅限 admin. 你的 user ID:
          </p>
          <code className="mt-3 inline-block rounded bg-stone-100 px-3 py-1 text-xs">
            {user.id}
          </code>
        </main>
      </>
    );
  }

  const stats = await getAdminStats();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header + admin nav */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              網站總覽 · {new Date().toLocaleString("zh-TW")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/pois"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              POI 審核
              {stats.content.pois.pending > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {stats.content.pois.pending}
                </span>
              )}
            </Link>
            <Link
              href="/admin/feedback"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              用戶反饋
              {stats.feedback.open > 0 && (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {stats.feedback.open}
                </span>
              )}
            </Link>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Google Analytics <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* 待辦警示 */}
        {(stats.content.pois.pending > 0 || stats.feedback.open > 0) && (
          <div className="mb-6 space-y-2">
            {stats.content.pois.pending > 0 && (
              <Link
                href="/admin/pois"
                className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100"
              >
                <AlertCircle size={20} />
                <span>
                  有 <strong>{stats.content.pois.pending}</strong> 個 UGC 景點等待你審核 →
                </span>
              </Link>
            )}
            {stats.feedback.open > 0 && (
              <Link
                href="/admin/feedback"
                className="flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 hover:bg-rose-100"
              >
                <AlertCircle size={20} />
                <span>
                  有 <strong>{stats.feedback.open}</strong> 則新用戶反饋等待處理 →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* 用戶統計 4 卡 */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
          用戶
        </h2>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="總註冊用戶" value={stats.users.total} icon={<Users size={18} />} accent="orange" />
          <StatCard label="今日新增" value={stats.users.today} hint="過去 24 小時" />
          <StatCard label="本週新增" value={stats.users.week} hint="過去 7 天" />
          <StatCard label="本月新增" value={stats.users.month} hint="過去 30 天" />
        </div>

        {/* 內容統計 6 卡 */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
          內容
        </h2>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="POI 上架"
            value={stats.content.pois.approved}
            icon={<MapPin size={18} />}
            hint={stats.content.pois.pending > 0 ? `+${stats.content.pois.pending} 待審` : undefined}
          />
          <StatCard
            label="行程"
            value={stats.content.itineraries.total}
            icon={<Bookmark size={18} />}
            hint={`${stats.content.itineraries.public} 個公開`}
          />
          <StatCard label="按讚" value={stats.content.likes} icon={<Heart size={18} />} />
          <StatCard label="留言" value={stats.content.comments} icon={<MessageCircle size={18} />} />
          <StatCard
            label="想去收藏"
            value={stats.content.bookmarks}
            icon={<BookmarkIcon size={18} />}
          />
          <StatCard
            label="AI 規劃總次數"
            value={stats.ai.itinerariesGenerated}
            hint="累計"
          />
        </div>

        {/* 最近註冊用戶 */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
          最近 20 個註冊用戶
        </h2>
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          {stats.recentUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-stone-500">還沒有用戶註冊</div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {stats.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName ?? "user"}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-amber-400 text-sm font-bold text-white">
                      {(u.displayName ?? u.email ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-stone-900">
                        {u.displayName ?? "未設暱稱"}
                      </span>
                      {u.provider && (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {u.provider}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-stone-500">{u.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-stone-700">
                      {relTime(u.createdAt)}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(u.createdAt).toLocaleString("zh-TW", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          <p>
            💡 想看詳細流量 (PV / UV / 跳出率 / 來源 / 國家)? 開 Google Analytics → 你的 kidgo property →「即時」/「報表」.
          </p>
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
  accent,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  hint?: string;
  accent?: "orange";
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${
        accent === "orange"
          ? "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50"
          : "border-stone-200"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${
          accent === "orange" ? "text-orange-700" : "text-stone-900"
        }`}
      >
        {value.toLocaleString()}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-stone-500">{hint}</div>}
    </div>
  );
}
