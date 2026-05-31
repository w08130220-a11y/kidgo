/**
 * 真實打一次 AI 規劃 API 量測 token 消耗 + 成本
 *
 * 用法: pnpm tsx scripts/test-ai-cost.ts
 *
 * 會用 dev server, 確保已啟動 pnpm dev (或自己改 BASE)
 * 或直接內聯呼叫 itinerary route handler (避免起 dev server)
 */
import * as fs from "node:fs";
import * as path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const BASE = process.env.TEST_BASE ?? "http://localhost:3000";

// Haiku 4.5 pricing (USD per million tokens)
const PRICE_IN = 1.0;
const PRICE_OUT = 5.0;
const PRICE_CACHE_WRITE = 1.25;
const PRICE_CACHE_READ = 0.1;

// 1 USD ≈ 32 NTD (粗估)
const USD_TO_NTD = 32;

const SAMPLE_REQUESTS = [
  {
    label: "北部單日 + 2 小孩 + 戶外",
    body: {
      adults: 2,
      kids: 2,
      kidAges: [4, 7],
      date: "this_weekend",
      startArea: "臺北市",
      destMode: "any",
      destAreas: [],
      duration: "full",
      intensity: "standard",
      budget: "mid",
      vibes: ["outdoor", "animals"],
      meals: [],
      needs: ["stroller"],
      notes: "",
    },
  },
  {
    label: "南部 2 天 + 1 小孩 + 學習",
    body: {
      adults: 2,
      kids: 1,
      kidAges: [6],
      date: "next_weekend",
      startArea: "高雄市",
      destMode: "any",
      destAreas: [],
      duration: "d2n1",
      intensity: "auto",
      budget: "high",
      vibes: ["learning", "indoor"],
      meals: [],
      needs: [],
      notes: "",
    },
  },
  {
    label: "北部半日 + 0 小孩 + 純放電",
    body: {
      adults: 2,
      kids: 0,
      kidAges: [],
      date: "tomorrow",
      startArea: "新北市",
      destMode: "any",
      destAreas: [],
      duration: "half",
      intensity: "chill",
      budget: "low",
      vibes: ["energy"],
      meals: [],
      needs: [],
      notes: "",
    },
  },
];

async function runOne(label: string, body: unknown) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/itinerary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - t0;
  if (!res.ok) {
    const text = await res.text();
    console.log(`❌ [${label}] HTTP ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }
  const data = (await res.json()) as {
    plans: Array<{ days: Array<{ poiIds: string[] }> }>;
    candidateCount: number;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    };
  };

  const u = data.usage;
  const inputCost = (u.input_tokens / 1_000_000) * PRICE_IN;
  const outputCost = (u.output_tokens / 1_000_000) * PRICE_OUT;
  const cacheWriteCost = (u.cache_creation_input_tokens / 1_000_000) * PRICE_CACHE_WRITE;
  const cacheReadCost = (u.cache_read_input_tokens / 1_000_000) * PRICE_CACHE_READ;
  const totalCostUsd = inputCost + outputCost + cacheWriteCost + cacheReadCost;
  const totalCostNtd = totalCostUsd * USD_TO_NTD;

  console.log(`\n━━━ [${label}] ━━━ (${ms}ms)`);
  console.log(`  候選池: ${data.candidateCount} 筆`);
  console.log(`  方案數: ${data.plans.length} 個`);
  console.log(`  Tokens:`);
  console.log(`    input (fresh):      ${u.input_tokens.toLocaleString().padStart(7)}`);
  console.log(`    output:             ${u.output_tokens.toLocaleString().padStart(7)}`);
  console.log(`    cache write:        ${u.cache_creation_input_tokens.toLocaleString().padStart(7)}`);
  console.log(`    cache read:         ${u.cache_read_input_tokens.toLocaleString().padStart(7)}`);
  console.log(`  成本:`);
  console.log(`    input    $${inputCost.toFixed(6)}`);
  console.log(`    output   $${outputCost.toFixed(6)}`);
  console.log(`    cache w  $${cacheWriteCost.toFixed(6)}`);
  console.log(`    cache r  $${cacheReadCost.toFixed(6)}`);
  console.log(`  ────────────────────────────`);
  console.log(`  total: $${totalCostUsd.toFixed(5)} USD ≈ NT$${totalCostNtd.toFixed(3)}`);

  return { totalCostUsd, totalCostNtd, usage: u, plans: data.plans.length };
}

async function main() {
  console.log(`測試 BASE: ${BASE}\n`);
  console.log(`Haiku 4.5 pricing:`);
  console.log(`  input        $${PRICE_IN}/M`);
  console.log(`  output       $${PRICE_OUT}/M`);
  console.log(`  cache write  $${PRICE_CACHE_WRITE}/M`);
  console.log(`  cache read   $${PRICE_CACHE_READ}/M`);

  const results = [];
  for (const r of SAMPLE_REQUESTS) {
    const out = await runOne(r.label, r.body);
    if (out) results.push(out);
    await new Promise((r) => setTimeout(r, 1500)); // 別連發
  }

  if (results.length === 0) return;
  const avgUsd = results.reduce((s, r) => s + r.totalCostUsd, 0) / results.length;
  const avgNtd = avgUsd * USD_TO_NTD;
  console.log(`\n\n═══ 總結 (${results.length} 次平均) ═══`);
  console.log(`  平均每次: $${avgUsd.toFixed(5)} USD ≈ NT$${avgNtd.toFixed(3)}`);
  console.log(`  推算 1000 次/天: NT$${(avgNtd * 1000).toFixed(0)} (≈ USD$${(avgUsd * 1000).toFixed(2)})`);
  console.log(`  推算 10000 次/天: NT$${(avgNtd * 10000).toFixed(0)} (≈ USD$${(avgUsd * 10000).toFixed(2)})`);
}

main().catch(console.error);
