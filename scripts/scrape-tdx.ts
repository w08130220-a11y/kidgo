/**
 * Step 1: 從 TDX 觀光署 API 抓 22 縣市的 ScenicSpot + Restaurant
 *
 * 用法: pnpm tdx:scrape [--force]
 *
 * 環境變數需要:
 *   TDX_APP_ID, TDX_APP_KEY
 *
 * 輸出: data/tdx-raw.json
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { TDX_CITIES, type TdxRawPoi } from "./types";

const OUTPUT_PATH = path.join(process.cwd(), "data", "tdx-raw.json");
const AUTH_URL = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
const API_BASE = "https://tdx.transportdata.tw/api/basic/v2/Tourism";
const FORCE = process.argv.includes("--force");

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function getAccessToken(): Promise<string> {
  const appId = process.env.TDX_APP_ID;
  const appKey = process.env.TDX_APP_KEY;
  if (!appId || !appKey) {
    fail("TDX_APP_ID and TDX_APP_KEY required in .env.local");
  }
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: appKey,
    }),
  });
  if (!res.ok) fail(`TDX auth failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  console.log(`✓ TDX token (expires in ${data.expires_in}s)`);
  return data.access_token;
}

async function fetchCity(
  token: string,
  city: { code: string; name: string },
  endpoint: "ScenicSpot" | "Restaurant"
): Promise<TdxRawPoi[]> {
  const url = `${API_BASE}/${endpoint}/${city.code}?%24top=2000&%24format=JSON`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Encoding": "br",
    },
  });
  if (!res.ok) {
    console.warn(`  ⚠ ${city.name} ${endpoint}: ${res.status}`);
    return [];
  }
  const raw = (await res.json()) as Record<string, unknown>[];
  return raw.map((item) => ({
    ...item,
    City: city.name,
    TdxCityCode: city.code,
    _sourceType: endpoint === "ScenicSpot" ? "scenicSpot" : "restaurant",
  })) as TdxRawPoi[];
}

async function main() {
  // 載 .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2];
    }
  }

  if (fs.existsSync(OUTPUT_PATH) && !FORCE) {
    const stats = fs.statSync(OUTPUT_PATH);
    const ageHrs = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    console.log(`✓ ${OUTPUT_PATH} 已存在 (${ageHrs.toFixed(1)} 小時前)`);
    console.log("  加 --force 強制重抓");
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  console.log("📡 取得 TDX access token...");
  const token = await getAccessToken();

  console.log(`📥 從 ${TDX_CITIES.length} 縣市抓 ScenicSpot + Restaurant...\n`);
  const all: TdxRawPoi[] = [];
  let totalScenic = 0;
  let totalRest = 0;

  for (const city of TDX_CITIES) {
    const [scenic, rest] = await Promise.all([
      fetchCity(token, city, "ScenicSpot"),
      fetchCity(token, city, "Restaurant"),
    ]);
    totalScenic += scenic.length;
    totalRest += rest.length;
    all.push(...scenic, ...rest);
    console.log(`  ${city.name.padEnd(6)}  景點 ${String(scenic.length).padStart(4)}  餐廳 ${String(rest.length).padStart(4)}`);
    // 禮貌一下, 避免 burst
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(all, null, 2));

  console.log(`\n✅ 完成:`);
  console.log(`   景點: ${totalScenic.toLocaleString()}`);
  console.log(`   餐廳: ${totalRest.toLocaleString()}`);
  console.log(`   總計: ${all.length.toLocaleString()} 筆`);
  console.log(`   檔案: ${OUTPUT_PATH}`);
  console.log(`\n下一步: pnpm tdx:enrich`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
