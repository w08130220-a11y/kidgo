/**
 * 灌 POI 到 Supabase.
 *
 * 來源:
 *   1. lib/mock-data.ts + seed-pois.ts (hand-curated + seed, ~72 筆)
 *   2. data/pois-enriched.json (TDX + AI 補強, 上千筆, 跑完 enrich 後存在)
 *
 * 用法:
 *   pnpm pois:import           # 灌所有來源
 *   pnpm pois:import --reset   # 先 truncate pois table 再灌 (危險)
 *
 * Idempotent: upsert by id, 重跑不會出錯, 但會更新欄位值
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { handCurated, type Poi } from "../lib/mock-data";
import { seedPois } from "../lib/seed-pois";

const mockDataPois: Poi[] = [...handCurated, ...seedPois];
import type { EnrichedPoi } from "./types";

const RESET = process.argv.includes("--reset");
const ENRICHED_PATH = path.join(process.cwd(), "data", "pois-enriched.json");

// 載 .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) fail("Supabase env not set in .env.local");

const TW_CITIES = [
  "臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市",
  "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣",
  "雲林縣", "嘉義市", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣",
  "臺東縣", "澎湖縣", "金門縣", "連江縣",
];

function extractCity(text: string | undefined): string | null {
  if (!text) return null;
  for (const c of TW_CITIES) {
    if (text.includes(c)) return c;
  }
  // 處理「台北」→「臺北市」這種簡寫
  if (text.includes("台北市")) return "臺北市";
  if (text.includes("台中市")) return "臺中市";
  if (text.includes("台南市")) return "臺南市";
  if (text.includes("台東")) return "臺東縣";
  return null;
}

function getSource(id: string): "hand" | "seed" | "tdx" {
  if (id.startsWith("seed_")) return "seed";
  if (id.startsWith("tdx_")) return "tdx";
  return "hand";
}

// Poi (mock-data shape) → DB row
function mockToDbRow(p: Poi) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    district: p.district,
    city: extractCity(p.address) ?? extractCity(p.district),
    address: p.address ?? null,
    age_min: p.ageMin,
    age_max: p.ageMax,
    duration_min: p.durationMin,
    price_min: p.priceMin,
    price_max: p.priceMax,
    description: p.description ?? null,
    tags: p.tags,
    photos: p.photos ?? [],
    phone: p.phone ?? null,
    requires_reservation: p.requiresReservation ?? false,
    estimated_kid: p.estimatedKid ?? null,
    kid_score: getSource(p.id) === "hand" ? 9 : 7,
    like_count: p.likes,
    source: getSource(p.id),
    status: "approved",
  };
}

// EnrichedPoi → DB row
function enrichedToDbRow(p: EnrichedPoi) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    district: p.district || extractCity(p.address) || p.city || "未分類",
    city: p.city || extractCity(p.address) || null,
    address: p.address || null,
    lat: p.lat,
    lng: p.lng,
    age_min: p.ageMin,
    age_max: p.ageMax,
    duration_min: p.durationMin,
    price_min: p.priceMin,
    price_max: p.priceMax,
    description: p.description,
    tags: p.parentingTags,
    photos: p.photos,
    phone: p.phone ?? null,
    open_time: p.openTime ?? null,
    requires_reservation: p.category === "restaurant" && p.priceMin > 200,
    estimated_kid: p.aiReasoning,
    ai_reasoning: p.aiReasoning,
    kid_score: p.kidScore,
    like_count: Math.round(p.kidScore * 100 + Math.random() * 200),
    source: "tdx" as const,
    source_id: p.sourceId,
    status: "approved",
  };
}

async function main() {
  const admin = createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Reset?
  if (RESET) {
    console.log("⚠ --reset: 刪光 pois table 全部資料 (含 user_upload!)");
    const { error } = await admin.from("pois").delete().neq("id", "");
    if (error) fail(`Reset failed: ${error.message}`);
    console.log("✓ Reset 完成\n");
  }

  // ─── Source 1: mock-data (hand + seed) ──────────────────────
  console.log(`📂 Source 1: mock-data.ts (hand + seed)`);
  const mockRows = mockDataPois.map(mockToDbRow);
  console.log(`   ${mockRows.length} 筆`);

  // ─── Source 2: TDX enriched ──────────────────────────────────
  let tdxRows: ReturnType<typeof enrichedToDbRow>[] = [];
  if (fs.existsSync(ENRICHED_PATH)) {
    const enriched: EnrichedPoi[] = JSON.parse(fs.readFileSync(ENRICHED_PATH, "utf-8"));
    console.log(`📂 Source 2: TDX enriched (${enriched.length} 筆)`);
    // Filter: kidScore >= 5 + 有 name + 至少有 city/address 其一 (district 可由 city fallback)
    const filtered = enriched.filter(
      (p) => p.kidScore >= 5 && p.name && (p.city || p.address)
    );
    tdxRows = filtered.map(enrichedToDbRow);
    console.log(`   過濾後 ${tdxRows.length} 筆 (篩掉 ${enriched.length - tdxRows.length} 筆無效)`);
  } else {
    console.log(`📂 Source 2: data/pois-enriched.json 不存在, 跳過 (跑 pnpm tdx:enrich 後再 import 即可)`);
  }

  // ─── Merge + dedupe by id ─────────────────────────────────────
  const allRowsMap = new Map<string, (typeof mockRows)[0] | (typeof tdxRows)[0]>();
  for (const r of mockRows) allRowsMap.set(r.id, r);
  for (const r of tdxRows) {
    if (allRowsMap.has(r.id)) continue; // mock-data 優先 (hand-curated 比 TDX 仔細)
    allRowsMap.set(r.id, r);
  }
  const allRows = Array.from(allRowsMap.values());
  console.log(`\n總計 ${allRows.length} 筆準備 upsert\n`);

  // ─── Bulk upsert (500 筆一批) ─────────────────────────────────
  const BATCH = 500;
  let done = 0;
  let errors = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await admin
      .from("pois")
      .upsert(batch as never, { onConflict: "id" });
    if (error) {
      errors++;
      console.error(`  ❌ Batch ${i}-${i + batch.length}: ${error.message.slice(0, 150)}`);
    } else {
      done += batch.length;
      console.log(`  ✓ ${done.toLocaleString()}/${allRows.length.toLocaleString()}`);
    }
  }

  // ─── Final count ─────────────────────────────────────────────
  const { count } = await admin.from("pois").select("*", { count: "exact", head: true });
  console.log(`\n✅ 完成. DB 內目前共 ${count?.toLocaleString()} 筆 POI`);
  if (errors > 0) console.log(`⚠ ${errors} 個 batch 失敗, 看上面 log`);

  // 統計 by source
  const { data: bySource } = await admin
    .from("pois")
    .select("source")
    .eq("status", "approved");
  if (bySource) {
    const sourceCounts = bySource.reduce<Record<string, number>>((acc, r) => {
      acc[(r as { source: string }).source] = (acc[(r as { source: string }).source] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`\n   by source:`);
    for (const [s, n] of Object.entries(sourceCounts)) {
      console.log(`     ${s.padEnd(8)} ${n.toLocaleString()}`);
    }
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
