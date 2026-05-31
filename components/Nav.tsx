import Link from "next/link";
import { Compass, Sparkles, User, Bookmark, LogOut, Plus } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";

export async function Nav() {
  let user: { email?: string; name?: string; avatar?: string } | null = null;
  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const meta = authUser.user_metadata ?? {};
      user = {
        email: authUser.email,
        name: meta.full_name ?? meta.name ?? authUser.email?.split("@")[0] ?? "用戶",
        avatar: meta.avatar_url ?? meta.picture,
      };
    }
  } catch {
    // Supabase 未設好或 cookie 讀不到 — 視為未登入
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🧒</span>
          <span className="text-lg font-bold tracking-tight">
            kidgo
            <span className="ml-1 hidden text-xs font-normal text-stone-500 sm:inline">
              全台親子．30 秒規劃
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/poi"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-stone-700 transition hover:bg-stone-200/60 sm:flex"
          >
            <Compass size={16} /> 探索
          </Link>
          <Link
            href="/chat"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-stone-700 transition hover:bg-stone-200/60 sm:flex"
          >
            <Sparkles size={16} /> AI 規劃
          </Link>
          <Link
            href="/poi/new"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-stone-700 transition hover:bg-stone-200/60 sm:flex"
          >
            <Plus size={16} /> 新增景點
          </Link>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-stone-50 transition hover:bg-stone-700"
            >
              <User size={16} /> 登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function UserMenu({ user }: { user: { email?: string; name?: string; avatar?: string } }) {
  const initial = (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  return (
    <div className="group relative">
      <button className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1 text-sm transition hover:border-stone-300">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name ?? "user"}
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-xs font-bold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate text-stone-700 sm:inline">
          {user.name}
        </span>
      </button>

      {/* Dropdown */}
      <div className="invisible absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-stone-200 bg-white p-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
        <div className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
          <div className="font-medium text-stone-700">{user.name}</div>
          <div className="truncate">{user.email}</div>
        </div>
        <Link
          href="/me/itineraries"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          <Bookmark size={14} /> 我的行程
        </Link>
        <Link
          href="/me/uploads"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          <Compass size={14} /> 我上傳的景點
        </Link>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={14} /> 登出
          </button>
        </form>
      </div>
    </div>
  );
}
