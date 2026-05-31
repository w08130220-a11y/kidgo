"use client";

/**
 * Nav 內的用戶頭像 dropdown.
 * 改成 client component, 用 useState 控制開關 (取代原 group-hover, 手機沒 hover).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Compass, Heart, LogOut } from "lucide-react";

export function UserMenu({
  user,
}: {
  user: { email?: string; name?: string; avatar?: string };
}) {
  const initial = (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // 點外面就關
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1 text-sm transition hover:border-stone-300"
      >
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

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
        >
          <div className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
            <div className="font-medium text-stone-700">{user.name}</div>
            <div className="truncate">{user.email}</div>
          </div>
          <Link
            href="/me/itineraries"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
          >
            <Bookmark size={14} /> 我的行程
          </Link>
          <Link
            href="/me/bookmarks"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
          >
            <Bookmark size={14} className="fill-amber-400 text-amber-500" /> 想去清單
          </Link>
          <Link
            href="/me/likes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
          >
            <Heart size={14} /> 我按過讚的
          </Link>
          <Link
            href="/me/uploads"
            onClick={() => setOpen(false)}
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
      )}
    </div>
  );
}
