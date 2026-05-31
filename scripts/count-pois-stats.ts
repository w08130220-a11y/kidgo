/**
 * 統計 DB POI 數量 + 各 kidScore 分布
 * 回答: 排除餐廳後剩多少 / 改 threshold 影響幾筆
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // ─── 1. DB 內 POI 總數
  const { count: total } = await sb
    .from("pois")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  console.log(`✅ DB 內共 ${total} 筆 approved POI\n`);

  // ─── 2. By category (Supabase 預設 1000 limit, 要分頁)
  const catCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const PAGE = 1000;
  for (let offset = 0; offset < (total ?? 0); offset += PAGE) {
    const { data: page } = await sb
      .from("pois")
      .select("category, source")
      .eq("status", "approved")
      .range(offset, offset + PAGE - 1);
    for (const r of page ?? []) {
      catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
      sourceCounts[r.source] = (sourceCounts[r.source] ?? 0) + 1;
    }
  }
  console.log("By category:");
  for (const [k, v] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(15)} ${v.toString().padStart(5)}`);
  }
  console.log("\nBy source:");
  for (const [k, v] of Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(15)} ${v.toString().padStart(5)}`);
  }

  const restaurants = catCounts["restaurant"] ?? 0;
  const nonRest = (total ?? 0) - restaurants;
  console.log(`\n📊 排除餐廳前: ${total} 筆`);
  console.log(`📊 排除餐廳後: ${nonRest} 筆 (-${restaurants})`);

  // ─── 3. kidScore 分布 (data/pois-enriched.json)
  const enrichedPath = path.join(process.cwd(), "data", "pois-enriched.json");
  if (!fs.existsSync(enrichedPath)) {
    console.log("\n⚠ data/pois-enriched.json 不存在, 無法分析 kidScore 分布");
    return;
  }
  const enriched = JSON.parse(fs.readFileSync(enrichedPath, "utf-8")) as Array<{
    kidScore: number;
    category: string;
    name: string;
  }>;
  console.log(`\n📂 TDX enriched 原始檔: ${enriched.length} 筆`);
  const scoreBucket: Record<string, number> = {
    "0-2 (不適合)": 0,
    "3-4 (不太建議)": 0,
    "5-6 (看年齡)": 0,
    "7-8 (親子適合)": 0,
    "9-10 (親子主打)": 0,
  };
  for (const p of enriched) {
    if (p.kidScore <= 2) scoreBucket["0-2 (不適合)"]++;
    else if (p.kidScore <= 4) scoreBucket["3-4 (不太建議)"]++;
    else if (p.kidScore <= 6) scoreBucket["5-6 (看年齡)"]++;
    else if (p.kidScore <= 8) scoreBucket["7-8 (親子適合)"]++;
    else scoreBucket["9-10 (親子主打)"]++;
  }
  console.log("\nkidScore 分布:");
  for (const [k, v] of Object.entries(scoreBucket)) {
    const pct = enriched.length > 0 ? ((v / enriched.length) * 100).toFixed(1) : "0";
    console.log(`  ${k.padEnd(20)} ${v.toString().padStart(5)} (${pct}%)`);
  }

  // ─── 4. 改 threshold 影響
  const ge5 = enriched.filter((p) => p.kidScore >= 5).length;
  const ge3 = enriched.filter((p) => p.kidScore >= 3).length;
  const ge5Rest = enriched.filter((p) => p.kidScore >= 5 && p.category === "restaurant").length;
  const ge3Rest = enriched.filter((p) => p.kidScore >= 3 && p.category === "restaurant").length;
  console.log(`\n📊 threshold 變化:`);
  console.log(`  目前 kidScore >= 5:   ${ge5} 筆 (含 ${ge5Rest} 間餐廳)`);
  console.log(`  改 kidScore >= 3:    ${ge3} 筆 (含 ${ge3Rest} 間餐廳)`);
  console.log(`  改 >= 3 多進來 ${ge3 - ge5} 筆 (kidScore 3-4 的)`);

  // ─── 5. 看 score 3-4 都是什麼 (取樣)
  const score34 = enriched.filter((p) => p.kidScore >= 3 && p.kidScore <= 4);
  console.log(`\nscore 3-4 取樣 20 筆 (改 threshold 會新增的):`);
  for (const p of score34.slice(0, 20)) {
    console.log(`  [score ${p.kidScore}] ${p.category.padEnd(10)} ${p.name.slice(0, 30)}`);
  }
}

main().catch(console.error);
