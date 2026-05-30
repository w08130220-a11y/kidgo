/**
 * Step 2: 用 Claude 補強 raw TDX 資料的親子欄位
 *
 * 用法: pnpm tdx:enrich [--force] [--limit=N]
 *
 * 環境變數:
 *   CHILDTRIP_ANTHROPIC_KEY
 *
 * 讀: data/tdx-raw.json
 * 寫: data/pois-enriched.json (邊跑邊存, 支援續跑)
 *
 * 為什麼要補強:
 *   TDX 原始資料沒有「適齡」「推車友善」「雨備」等親子父母想要的欄位.
 *   讓 Claude 讀名稱+描述+地址, 推論出這些.
 *
 * 成本估算 (5000 筆):
 *   - input ~500 tok/筆 (有 cache, 實際 ~50 tok), 5000 × 50 × $0.10/M = $0.025
 *   - output ~200 tok/筆, 5000 × 200 × $5/M = $5
 *   - 總計約 $5-8 USD
 */
import * as fs from "node:fs";
import * as path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { TdxRawPoi, EnrichedPoi } from "./types";

const INPUT_PATH = path.join(process.cwd(), "data", "tdx-raw.json");
const OUTPUT_PATH = path.join(process.cwd(), "data", "pois-enriched.json");
const FORCE = process.argv.includes("--force");
const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0", 10);
const FLUSH_EVERY = 10; // 每 10 筆寫入一次

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

const enrichTool = {
  name: "classify_poi",
  description: "Classify a Taiwan POI for kid-friendly trip planning",
  input_schema: {
    type: "object" as const,
    required: ["category", "ageMin", "ageMax", "durationMin", "priceMin", "priceMax", "parentingTags", "kidScore", "reasoning"],
    properties: {
      category: {
        type: "string",
        enum: ["park", "museum", "restaurant", "zoo", "amusement", "indoor"],
        description: "park=公園/戶外步道, museum=博物館/展館, restaurant=餐廳/咖啡, zoo=動物互動, amusement=遊樂園/樂高/水族館, indoor=室內遊戲場/親子館",
      },
      ageMin: { type: "integer", minimum: 0, maximum: 18, description: "適合的最小年齡, 通常 0-6" },
      ageMax: { type: "integer", minimum: 0, maximum: 99, description: "適合的最大年齡, 通常 8-99" },
      durationMin: { type: "integer", description: "建議停留分鐘, 通常 60-240" },
      priceMin: { type: "integer", description: "人均最低費用 NT$, 免費寫 0" },
      priceMax: { type: "integer", description: "人均最高費用 NT$, 免費寫 0" },
      parentingTags: {
        type: "array",
        items: { type: "string" },
        description: "從以下選, 最多 6 個: 戶外/室內/室內外/免費/雨天首選/雨天備案/推車友善/有遊戲區/捷運直達/需開車/動物互動/可野餐/玩水/夏天首選/季節限定/可過夜/需訂位",
      },
      kidScore: {
        type: "integer",
        minimum: 0,
        maximum: 10,
        description: "親子友善程度 0-10. 10=明顯設計給親子(科教館/動物園), 7-9=親子很適合(公園/兒童餐廳), 4-6=可以帶小孩但不主打, 0-3=不適合(夜店/酒吧/成人 SPA). v1 只保留 >=5 的",
      },
      reasoning: {
        type: "string",
        description: "30 字內中文說明為什麼這樣分類, 給人類 review",
      },
    },
  },
};

const SYSTEM_PROMPT = `你是台灣親子場館分類專家. 看一個 POI 的名稱+描述+地址+類別, 判斷它對親子家庭的適合程度.

判斷準則:
- **kidScore 9-10**: 明顯為親子設計 (動物園/科教館/兒童樂園/親子餐廳/公園遊戲場)
- **kidScore 7-8**: 親子很適合但非主打 (大公園/博物館/夜市/老街/海邊)
- **kidScore 5-6**: 帶小孩沒問題但要看年齡 (歷史古蹟/宗教場所/觀光工廠)
- **kidScore 3-4**: 不太建議 (一般咖啡廳/精品店/酒吧)
- **kidScore 0-2**: 完全不適合 (夜店/酒吧/SPA/紋身店)

請務必呼叫 classify_poi 工具.`;

type EnrichResult = {
  category: EnrichedPoi["category"];
  ageMin: number;
  ageMax: number;
  durationMin: number;
  priceMin: number;
  priceMax: number;
  parentingTags: string[];
  kidScore: number;
  reasoning: string;
};

async function enrichOne(client: Anthropic, raw: TdxRawPoi): Promise<EnrichResult | null> {
  const name = raw.ScenicSpotName ?? raw.RestaurantName ?? "(無名)";
  const desc = raw.DescriptionDetail ?? raw.Description ?? "";
  const addr = raw.Address ?? "(無地址)";
  const cls = [raw.Class1, raw.Class2, raw.Class3].filter(Boolean).join(" / ");
  const sourceType = raw._sourceType === "restaurant" ? "餐廳" : "景點";

  const userPrompt = `# POI 資料
- 名稱: ${name}
- 類型 (TDX 分類): ${sourceType} / ${cls || "(無)"}
- 地址: ${addr}
- 描述: ${desc.slice(0, 800)}

請呼叫 classify_poi 工具分類.`;

  try {
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
      tools: [enrichTool as Anthropic.Tool],
      tool_choice: { type: "tool", name: "classify_poi" },
    });
    const toolUse = resp.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;
    return toolUse.input as EnrichResult;
  } catch (err) {
    console.warn(`    ⚠ ${name}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

function extractDistrict(addr: string): string {
  // 從 "桃園市中壢區春德路105號" 抓 "中壢區"
  const m = addr.match(/[市縣]([一-龥]{1,3}[區鄉鎮市])/);
  return m ? m[1] : "";
}

function extractPhotos(raw: TdxRawPoi): string[] {
  if (!raw.Picture) return [];
  const out: string[] = [];
  if (raw.Picture.PictureUrl1) out.push(raw.Picture.PictureUrl1);
  if (raw.Picture.PictureUrl2) out.push(raw.Picture.PictureUrl2);
  if (raw.Picture.PictureUrl3) out.push(raw.Picture.PictureUrl3);
  return out;
}

async function main() {
  // 載 env
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] = m[2];
    }
  }

  if (!process.env.CHILDTRIP_ANTHROPIC_KEY) {
    fail("CHILDTRIP_ANTHROPIC_KEY required in .env.local");
  }
  if (!fs.existsSync(INPUT_PATH)) {
    fail(`找不到 ${INPUT_PATH}. 先跑 pnpm tdx:scrape`);
  }

  const raws: TdxRawPoi[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  console.log(`📂 載入 ${raws.length.toLocaleString()} 筆 raw POI`);

  // 載入已完成的 (續跑)
  const enriched: EnrichedPoi[] = [];
  const doneIds = new Set<string>();
  if (fs.existsSync(OUTPUT_PATH) && !FORCE) {
    const existing: EnrichedPoi[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
    enriched.push(...existing);
    existing.forEach((e) => doneIds.add(e.sourceId));
    console.log(`📂 已完成 ${enriched.length.toLocaleString()} 筆, 從第 ${enriched.length + 1} 筆續跑`);
  }

  const todo = raws.filter((r) => {
    const id = r.ScenicSpotID ?? r.RestaurantID ?? "";
    return id && !doneIds.has(id);
  });
  const targets = LIMIT > 0 ? todo.slice(0, LIMIT) : todo;
  console.log(`🤖 待處理 ${targets.length.toLocaleString()} 筆\n`);

  const client = new Anthropic({
    apiKey: process.env.CHILDTRIP_ANTHROPIC_KEY,
    baseURL: "https://api.anthropic.com",
  });

  let processed = 0;
  let skipped = 0;
  let kept = 0;
  const startTime = Date.now();

  for (const raw of targets) {
    const sourceId = raw.ScenicSpotID ?? raw.RestaurantID ?? "";
    const name = raw.ScenicSpotName ?? raw.RestaurantName ?? "(無名)";

    const result = await enrichOne(client, raw);
    processed++;

    if (!result) {
      skipped++;
    } else if (result.kidScore < 5) {
      skipped++;
      if (processed % 20 === 0) console.log(`  ${processed}/${targets.length} skip ${name} (score ${result.kidScore})`);
    } else {
      const lat = raw.Position?.PositionLat ?? raw.PositionLat ?? 0;
      const lng = raw.Position?.PositionLon ?? raw.PositionLon ?? 0;
      const enrichedPoi: EnrichedPoi = {
        id: `tdx_${raw._sourceType}_${sourceId}`,
        name,
        category: result.category,
        district: extractDistrict(raw.Address ?? ""),
        city: raw.City,
        address: raw.Address ?? "",
        lat,
        lng,
        phone: raw.Phone,
        openTime: raw.OpenTime,
        description: (raw.DescriptionDetail ?? raw.Description ?? "").slice(0, 300),
        photos: extractPhotos(raw),
        ageMin: result.ageMin,
        ageMax: result.ageMax,
        durationMin: result.durationMin,
        priceMin: result.priceMin,
        priceMax: result.priceMax,
        parentingTags: result.parentingTags,
        kidScore: result.kidScore,
        aiReasoning: result.reasoning,
        source: "tdx",
        sourceId,
        enrichedAt: new Date().toISOString(),
      };
      enriched.push(enrichedPoi);
      kept++;
    }

    // Flush periodically
    if (processed % FLUSH_EVERY === 0) {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enriched, null, 2));
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = (targets.length - processed) / rate;
      console.log(
        `  ${processed}/${targets.length} (kept ${kept}, skip ${skipped}) ` +
          `${rate.toFixed(1)}/s ~${Math.ceil(remaining / 60)} 分鐘剩`
      );
    }

    // Throttle: 10 req/s (Anthropic free tier safe)
    await new Promise((r) => setTimeout(r, 100));
  }

  // Final flush
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enriched, null, 2));

  console.log(`\n✅ 完成:`);
  console.log(`   處理: ${processed.toLocaleString()} 筆`);
  console.log(`   保留 (kidScore >= 5): ${kept.toLocaleString()}`);
  console.log(`   過濾掉: ${skipped.toLocaleString()}`);
  console.log(`   檔案: ${OUTPUT_PATH}`);
  console.log(`\n下一步: pnpm tdx:build`);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
