/**
 * Server-side Supabase clients.
 *
 * 兩種:
 * 1. createServerClient() — 走用戶 cookie 的 server client (Server Components / Route Handlers)
 *    - 受 RLS 保護
 *    - 用於: 讀寫用戶自己的資料
 *
 * 2. createAdminClient() — service_role bypass RLS
 *    - 不受 RLS 限制, 不要傳給瀏覽器
 *    - 用於: 後台批次 import POI, 加積分等 trusted server-side 操作
 */
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 內無法 set cookie - 由 middleware 處理
          }
        },
      },
    }
  );
}

/**
 * Admin client — 繞過 RLS, 只能在 server-side 用. 永遠不要 import 到 client component.
 * 用途: import script, point_events insert, moderation queue 操作.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
