"use client";

/**
 * Browser-side Supabase client.
 * 用於: client component 內讀公開資料 / 觸發 client-side auth flow
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
