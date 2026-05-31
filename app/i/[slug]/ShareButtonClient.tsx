"use client";

/**
 * 公開分享頁的「複製連結」按鈕
 * Server component 不能用 navigator.clipboard, 所以拆 client wrapper
 */
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ShareButtonClient({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/i/${slug}`
        : `/i/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt 讓用戶手動複製
      window.prompt("複製這個連結:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
      aria-label="複製分享連結"
    >
      {copied ? (
        <>
          <Check size={16} className="text-emerald-600" />
          已複製
        </>
      ) : (
        <>
          <Copy size={16} />
          分享
        </>
      )}
    </button>
  );
}
