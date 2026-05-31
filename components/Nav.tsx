import Link from "next/link";
import { Compass, Sparkles, User, Plus } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { UserMenu } from "./UserMenu";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="kidgo" className="h-11 w-11 sm:h-12 sm:w-12" />
          <span className="text-xl font-bold tracking-tight sm:text-2xl">
            kidgo
            <span className="ml-1.5 hidden text-xs font-normal text-stone-500 md:inline">
              全台親子．30 秒規劃
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {/* Mobile (< sm): 只顯示 icon, 節省空間 */}
          <Link
            href="/poi"
            aria-label="探索"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-stone-700 transition hover:bg-stone-200/60"
          >
            <Compass size={16} /> <span className="hidden sm:inline">探索</span>
          </Link>
          <Link
            href="/chat"
            aria-label="AI 規劃"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-stone-700 transition hover:bg-stone-200/60"
          >
            <Sparkles size={16} /> <span className="hidden sm:inline">AI 規劃</span>
          </Link>
          <Link
            href="/poi/new"
            aria-label="新增景點"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-stone-700 transition hover:bg-stone-200/60"
          >
            <Plus size={16} /> <span className="hidden sm:inline">新增景點</span>
          </Link>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-stone-50 transition hover:bg-stone-700"
            >
              <User size={16} /> <span className="hidden sm:inline">登入</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
