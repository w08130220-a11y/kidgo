/**
 * Quick sanity check: 連線 Supabase, 確認 env 設對, 可選擇性看 table 是否存在.
 * 用法: pnpm tsx scripts/test-supabase.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

// 載入 .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== Supabase Env Check ===");
console.log(`URL:         ${url ? `${url.slice(0, 35)}...` : "❌ MISSING"}`);
console.log(`anon key:    ${anonKey ? `${anonKey.slice(0, 25)}...` : "❌ MISSING"} (${anonKey?.length} chars)`);
console.log(`service key: ${serviceKey ? `${serviceKey.slice(0, 12)}...` : "❌ MISSING"} (${serviceKey?.length} chars)`);

if (!url || !anonKey || !serviceKey) {
  console.error("\n❌ 缺 env, 補完再來");
  process.exit(1);
}

console.log("\n=== Connection Test ===");

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const tables = ["pois", "profiles", "itineraries", "likes", "comments", "user_points", "point_events"];
  console.log("\n檢查 7 張表存在狀況:");
  for (const t of tables) {
    const { error, count } = await adminClient
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ❌ ${t.padEnd(15)} ${error.code === "PGRST205" || error.code === "42P01" ? "不存在" : error.message}`);
    } else {
      console.log(`  ✓ ${t.padEnd(15)} 存在 (${count ?? 0} 筆)`);
    }
  }
}

main();
