"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleGoogle = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      setState("error");
      setMsg(error.message);
    } else {
      setState("sent");
      setMsg("登入連結已寄出，請去信箱點連結。");
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <div className="text-4xl">🧒</div>
        <h1 className="mt-3 text-2xl font-bold">登入 kidgo</h1>
        <p className="mt-2 text-sm text-stone-600">
          儲存無限行程 ・ 跨裝置同步 ・ 上傳景點 ・ 累積積分
        </p>
      </div>

      {initialError && (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          登入失敗：{decodeURIComponent(initialError)}
        </div>
      )}

      <div className="mt-6 space-y-2">
        <button
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          用 Google 登入
        </button>

        <div className="my-3 flex items-center gap-2 text-[11px] text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          或用 Email
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <form onSubmit={handleMagicLink} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={state === "sending" || state === "sent"}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-orange-400 disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={state === "sending" || state === "sent"}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              state === "sent"
                ? "bg-emerald-500 text-white"
                : "bg-orange-500 text-white hover:bg-orange-600"
            } ${state === "sending" ? "opacity-60 cursor-wait" : ""}`}
          >
            {state === "sending" ? "寄信中..." : state === "sent" ? "✓ 已寄出" : "寄送登入連結"}
          </button>
        </form>
      </div>

      {msg && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            state === "error" ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {msg}
        </p>
      )}

      <p className="mt-6 text-center text-[11px] text-stone-500">
        登入即表示你同意我們的
        <Link href="/terms" className="ml-1 underline">服務條款</Link>
        跟
        <Link href="/privacy" className="ml-1 underline">隱私政策</Link>
      </p>
    </div>
  );
}
