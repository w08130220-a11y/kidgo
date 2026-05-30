import Link from "next/link";
import { Compass, Sparkles, Trophy, User } from "lucide-react";

export function Nav() {
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
            href="/leaderboard"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-stone-700 transition hover:bg-stone-200/60 sm:flex"
          >
            <Trophy size={16} /> 排行
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-stone-50 transition hover:bg-stone-700"
          >
            <User size={16} /> 登入
          </Link>
        </nav>
      </div>
    </header>
  );
}
