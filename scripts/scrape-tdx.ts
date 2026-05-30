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
  endpoint: "ScenicSpot" | "Restaurant",
  attempt = 1
): Promise<TdxRawPoi[]> {
  const url = `${API_BASE}/${endpoint}/${city.code}?%24top=2000&%24format=JSON`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Encoding": "br",
    },
  });
  if (res.status === 429 && attempt <= 3) {
    const waitS = 30 * attempt;
    console.warn(`  ⏳ ${city.name} ${endpoint}: 429 rate limited, wait ${waitS}s (attempt ${attempt}/3)...`);
    await new Promise((r) => setTimeout(r, waitS * 1000));
    return fetchCity(token, city, endpoint, attempt + 1);
  }
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

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  if (FORCE && fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
    console.log("✓ --force 模式: 已刪除舊資料");
  }

  console.log("📡 取得 TDX access token...");
  const token = await getAccessToken();

  console.log(`📥 從 ${TDX_CITIES.length} 縣市抓 ScenicSpot + Restaurant (sequential + throttle)...\n`);

  // Resume mode: read existing file, fetch only missing cities
  let all: TdxRawPoi[] = [];
  const doneCities = new Set<string>();
  if (fs.existsSync(OUTPUT_PATH) && !FORCE) {
    all = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
    all.forEach((p) => doneCities.add(p.City));
    console.log(`✓ 已有 ${all.length} 筆 (${doneCities.size} 個縣市), resume mode 只抓缺的\n`);
  }

  let totalScenic = all.filter((p) => p._sourceType === "scenicSpot").length;
  let totalRest = all.filter((p) => p._sourceType === "restaurant").length;

  for (const city of TDX_CITIES) {
    if (doneCities.has(city.name)) {
      console.log(`  ${city.name.padEnd(6)}  ✓ 已抓過, 跳過`);
      continue;
    }
    // Sequential per endpoint (不要 parallel, 避免 burst)
    const scenic = await fetchCity(token, city, "ScenicSpot");
    await new Promise((r) => setTimeout(r, 1500));
    const rest = await fetchCity(token, city, "Restaurant");
    totalScenic += scenic.length;
    totalRest += rest.length;
    all.push(...scenic, ...rest);
    console.log(`  ${city.name.padEnd(6)}  景點 ${String(scenic.length).padStart(4)}  餐廳 ${String(rest.length).padStart(4)}`);

    // 增量寫檔 (跑到一半中斷不會全丟)
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(all, null, 2));

    // 城市間 2 秒間隔, 避免 burst 觸發 429
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✅ 完成:`);
  console.log(`   景點: ${totalScenic.toLocaleString()}`);
  console.log(`   餐廳: ${totalRest.toLocaleString()}`);
  console.log(`   總計: ${all.length.toLocaleString()} 筆`);
  console.log(`   檔案: ${OUTPUT_PATH}`);
  console.log(`\n下一步: pnpm tdx:enrich`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
