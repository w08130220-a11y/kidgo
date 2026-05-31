import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getPois } from "@/lib/poi-queries";
import type { Poi } from "@/lib/mock-data";

// ────────────────────────────────────────────────────────────────────
// Shared types (mirror of client wizard data)
// ────────────────────────────────────────────────────────────────────

type DateChoice = "today" | "tomorrow" | "this_weekend" | "next_weekend";
type Duration = "half" | "full" | "d2n1" | "d3n2";
type Intensity = "chill" | "standard" | "packed" | "auto";
type WizardData = {
  adults: number;
  kids: number;
  kidAges: number[];
  date: DateChoice;
  startArea: string;
  destMode: "any" | "specific";
  destAreas: string[];
  duration: Duration;
  intensity?: Intensity;
  budget: string;
  vibes: string[];
  meals: string[];
  needs: string[];
  notes: string;
};

type Zone = "north" | "central" | "south" | "east" | "island";

const REGION_ZONE: Record<string, Zone> = {
  "基隆市": "north", "臺北市": "north", "新北市": "north",
  "桃園市": "north", "新竹市": "north", "新竹縣": "north",
  "宜蘭縣": "north",
  "苗栗縣": "central", "臺中市": "central", "彰化縣": "central",
  "南投縣": "central", "雲林縣": "central",
  "嘉義市": "south", "嘉義縣": "south", "臺南市": "south",
  "高雄市": "south", "屏東縣": "south",
  "花蓮縣": "east", "臺東縣": "east",
  "澎湖縣": "island", "金門縣": "island", "連江縣": "island",
};

const ADJACENT: Record<Zone, Zone[]> = {
  north: ["central"], central: ["north", "south"],
  south: ["central", "east"], east: ["south", "central"], island: [],
};

const VIBE_LABEL: Record<string, string> = {
  outdoor: "戶外大自然", indoor: "室內探索", animals: "動物互動",
  learning: "學習教育", food: "親子美食", energy: "純放電",
};

// ────────────────────────────────────────────────────────────────────
// Candidate filtering (same logic as client)
// ────────────────────────────────────────────────────────────────────

function poiZone(p: Poi): Zone | null {
  for (const region of Object.keys(REGION_ZONE)) {
    if (p.address?.includes(region) || p.district.includes(region)) {
      return REGION_ZONE[region];
    }
  }
  return null;
}

function zoneAllowed(start: Zone, pz: Zone | null, dur: Duration): boolean {
  if (!pz) return true;
  if (pz === start) return true;
  const adj = ADJACENT[start]?.includes(pz);
  if (dur === "half" || dur === "full") return false;
  if (dur === "d2n1") return adj;
  return true;
}

// Zone (north/central/south/east/island) → 中文 region (北部/中部/...)
const ZONE_TO_REGION: Record<Zone, string> = {
  north: "北部", central: "中部", south: "南部", east: "東部", island: "離島",
};

async function filterCandidates(d: WizardData): Promise<Poi[]> {
  const hasKids = d.kidAges.length > 0;
  const minAge = hasKids ? Math.min(...d.kidAges) : 0;
  const maxAge = hasKids ? Math.max(...d.kidAges) : 99;
  const startZone = REGION_ZONE[d.startArea] ?? "north";

  // 計算允許的 zones (同 zone + 鄰近 if multi-day)
  const allowedZones: Zone[] = [startZone];
  if (d.duration === "d2n1" || d.duration === "d3n2") {
    allowedZones.push(...ADJACENT[startZone]);
  }
  if (d.duration === "d3n2") {
    // 3 天放更寬: 加 adjacent 的 adjacent
    const moreZones = new Set<Zone>(allowedZones);
    for (const z of allowedZones) ADJACENT[z].forEach((a) => moreZones.add(a));
    allowedZones.splice(0, allowedZones.length, ...moreZones);
  }
  const allowedRegions = Array.from(new Set(allowedZones.map((z) => ZONE_TO_REGION[z])));

  let candidates: Poi[] = [];

  if (d.destMode === "specific" && d.destAreas.length > 0) {
    // 用戶明指目的地 → 放開 zone 限制, 全台搜
    // 不然「臺北出發 + 想去南投」一日遊就會找不到任何南投 POI (因為南投在中部 zone)
    // 用戶都明說要去那了, 距離他自己負責
    const ALL_REGIONS = ["北部", "中部", "南部", "東部", "離島"];
    const all: Poi[] = [];
    for (const region of ALL_REGIONS) {
      const partial = await getPois({
        region,
        limit: 200,
        age03: hasKids && minAge <= 3 ? true : false,
        age36: hasKids && minAge <= 6 && maxAge >= 3 ? true : false,
        age612: hasKids && maxAge >= 6 ? true : false,
      });
      all.push(...partial);
    }
    // de-dupe + filter by destAreas
    const seen = new Set<string>();
    for (const p of all) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      const matchDest = d.destAreas.some(
        (a) => p.district.includes(a) || p.address?.includes(a) || p.name.includes(a)
      );
      if (matchDest) candidates.push(p);
    }
  } else {
    // Generic query by zones
    const all: Poi[] = [];
    for (const region of allowedRegions) {
      const partial = await getPois({ region, limit: 300 });
      all.push(...partial);
    }
    // dedupe
    const seen = new Set<string>();
    for (const p of all) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      if (hasKids && (p.ageMax < minAge || p.ageMin > maxAge)) continue;
      candidates.push(p);
    }
  }

  // v1.8: 餐廳留在候選池, AI 自由決定是否納入行程
  // (餐廳大多是親子餐廳/觀光工廠帶餐廳, 排進中午/晚上時段也合理)

  // v1.7: 智慧前篩 — 按用戶 vibes/needs/budget 評分排序, 取 top 40
  // 不再單純按 likes 排序, 因為 likes 高 ≠ 符合用戶需求
  candidates.sort((a, b) => scoreForUser(b, d) - scoreForUser(a, d));
  if (candidates.length > 40) candidates = candidates.slice(0, 40);

  return candidates;
}

// ────────────────────────────────────────────────────────────────────
// v1.7 智慧前篩: 給每筆 POI 按用戶需求打分數
// ────────────────────────────────────────────────────────────────────

// vibe → 直接對應的 tags (在 POI 的 parentingTags 裡)
const VIBE_TO_TAGS: Record<string, string[]> = {
  outdoor: ["戶外"],
  indoor: ["室內", "室內外"],
  animals: ["動物互動"],
  learning: [], // 走 category
  food: ["有遊戲區"], // 親子餐廳通常有遊戲區
  energy: ["有遊戲區", "玩水"],
};

// vibe → 直接對應的 category
const VIBE_TO_CATEGORIES: Record<string, string[]> = {
  learning: ["museum"],
  animals: ["zoo"],
  energy: ["amusement", "indoor"],
  outdoor: ["park"],
  indoor: ["museum", "indoor", "amusement"],
  food: ["restaurant"], // 親子美食 vibe 拉高餐廳分數
};

// needs → 對應的 tags
const NEED_TO_TAGS: Record<string, string[]> = {
  stroller: ["推車友善"],
  rainy: ["雨天首選", "雨天備案", "室內"],
  metro: ["捷運直達"],
  // accessible / no_crowd: 目前 tag 系統沒對應, 跳過
};

function scoreForUser(p: Poi, d: WizardData): number {
  let s = 0;

  // Baseline: likes 規範化到 0-1, 避免被需求分數蓋過
  s += Math.min((p.likes ?? 0) / 1000, 1);

  // Vibes 強匹配 (+3 per match)
  for (const v of d.vibes) {
    const tags = VIBE_TO_TAGS[v] ?? [];
    if (tags.some((t) => p.tags.includes(t))) s += 3;
    const cats = VIBE_TO_CATEGORIES[v] ?? [];
    if (cats.includes(p.category)) s += 3;
  }

  // Needs 中度匹配 (+2 per match)
  for (const n of d.needs) {
    const tags = NEED_TO_TAGS[n] ?? [];
    if (tags.some((t) => p.tags.includes(t))) s += 2;
  }

  // Budget 偏好
  if (d.budget === "low") {
    if (p.priceMin === 0 && p.priceMax === 0) s += 2; // 完全免費
    else if (p.priceMin < 200) s += 1;
  } else if (d.budget === "mid") {
    if (p.priceMin >= 0 && p.priceMin <= 500) s += 0.5;
  }
  // high / premium / none: 不加減

  // 年齡精準匹配加分 (有小孩時, 年齡剛好涵蓋)
  if (d.kidAges.length > 0) {
    const minAge = Math.min(...d.kidAges);
    const maxAge = Math.max(...d.kidAges);
    if (p.ageMin <= minAge && p.ageMax >= maxAge) s += 1;
  }

  return s;
}

const numDays = (d: Duration) => (d === "d3n2" ? 3 : d === "d2n1" ? 2 : 1);

// 計算每天 stops 範圍 (純景點, v1.6 起不排餐廳).
function stopRange(duration: Duration, intensity: Intensity = "auto"): { min: number; max: number } {
  const isHalf = duration === "half";
  return {
    chill:    isHalf ? { min: 2, max: 3 } : { min: 2, max: 3 },
    standard: isHalf ? { min: 3, max: 3 } : { min: 3, max: 4 },
    packed:   isHalf ? { min: 3, max: 4 } : { min: 4, max: 5 },
    auto:     isHalf ? { min: 2, max: 3 } : { min: 3, max: 5 },
  }[intensity];
}

const INTENSITY_LABEL: Record<Intensity, string> = {
  chill: "輕鬆 (2-3 個景點)",
  standard: "標準 (3-4 個景點)",
  packed: "充實 (4-5 個景點)",
  auto: "AI 自己決定",
};
const SLOT_FULL = ["上午", "中午", "下午", "傍晚", "晚上"];
const SLOT_HALF = ["上午", "中午", "下午"];

// ────────────────────────────────────────────────────────────────────
// Claude tool schema (forces structured output)
// ────────────────────────────────────────────────────────────────────

const itineraryTool = {
  name: "create_plans",
  description: "Generate 1-2 distinct family-trip itinerary plans from the candidate POIs.",
  input_schema: {
    type: "object" as const,
    properties: {
      plans: {
        type: "array",
        minItems: 1,
        maxItems: 2,
        description: "1-2 distinct plans. Prefer 2 but if you cannot produce 2 meaningfully different plans (e.g. tiny candidate pool, all flavors converge), return 1. Order by badge_type: balanced first, then a contrast plan (budget or premium).",
        items: {
          type: "object",
          required: ["theme", "description", "badge_type", "days"],
          properties: {
            theme: {
              type: "string",
              description: "Short Chinese plan name 4-12 chars, e.g. '戶外放電版' or '雨備室內版'",
            },
            description: {
              type: "string",
              description: "One Chinese sentence explaining the plan, 20-50 chars",
            },
            badge_type: { type: "string", enum: ["balanced", "budget", "premium"] },
            days: {
              type: "array",
              description: "One entry per day. If trip is 2D1N output 2 days, 3D2N output 3 days",
              items: {
                type: "object",
                required: ["stops"],
                properties: {
                  stops: {
                    type: "array",
                    description: "Stops in chronological order for that day",
                    items: {
                      type: "object",
                      required: ["poi_id", "reason"],
                      properties: {
                        poi_id: {
                          type: "string",
                          description: "MUST be exactly one of the candidate POI ids — no inventions",
                        },
                        reason: {
                          type: "string",
                          description: "One-sentence Chinese reason why this fits this family, 15-50 chars. Be specific about what about this place suits the kids/vibe/budget. Don't be generic.",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    required: ["plans"],
  },
};

// ────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!process.env.CHILDTRIP_ANTHROPIC_KEY) {
    return NextResponse.json(
      { error: "CHILDTRIP_ANTHROPIC_KEY not set in .env.local" },
      { status: 503 }
    );
  }

  let d: WizardData;
  try {
    d = (await req.json()) as WizardData;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const candidates = await filterCandidates(d);
  if (candidates.length < 3) {
    return NextResponse.json(
      { error: "符合條件的景點太少", candidateCount: candidates.length },
      { status: 422 }
    );
  }

  // Build prompts
  const candidateJson = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    district: p.district,
    age_range: `${p.ageMin}-${p.ageMax}歲`,
    minutes: p.durationMin,
    price: p.priceMin === 0 && p.priceMax === 0 ? "免費" : `NT$${p.priceMin}-${p.priceMax}/人`,
    tags: p.tags.join(","),
    likes: p.likes,
    desc: p.description,
    needs_reservation: p.requiresReservation ?? false,
  }));

  const days = numDays(d.duration);
  const intensity = d.intensity ?? "auto";
  const range = stopRange(d.duration, intensity);
  const perDay = range.max;
  const minStops = range.min;
  const slotNames = d.duration === "half" ? SLOT_HALF : SLOT_FULL;
  const intensityLabel = INTENSITY_LABEL[intensity];
  const vibesStr = d.vibes.map((v) => VIBE_LABEL[v] ?? v).join("、") || "(無偏好)";
  const needsStr = d.needs.length > 0 ? d.needs.join("、") : "無";
  const dateStr = { today: "今天", tomorrow: "明天", this_weekend: "這週末", next_weekend: "下週末" }[d.date];
  const BUDGET_LABELS = {
    low: "<2,000", mid: "2,000-5,000", high: "5,000-10,000",
    premium: "10,000+", none: "沒上限",
  } as const;
  const budgetStr = BUDGET_LABELS[d.budget as keyof typeof BUDGET_LABELS] ?? d.budget;

  const systemPrompt = `你是台灣親子行程規劃師, 幫忙產出 2 個風格不同的一日/多日行程方案.

## 嚴格規則 (違反一律 reject)
1. **只能從 candidate POI list 選 poi_id**, 絕對不可以編造不存在的 id
   - poi_id 必須**逐字複製**自候選 list 的 \`id\` 欄位 (character-by-character copy)
   - **每個字母都不能改**. 例如:
     - 看到 \`seed_ty_daxi\` 寫 \`seed_ty_daxi\` (不要寫成 seed_yt_daxi)
     - 看到 \`poi_daanforest\` 寫 \`poi_daanforest\` (不要寫成 seed_daanforest)
   - 寫前**目視對照**候選 list 中的精確字串
2. 每天 ${minStops}-${perDay} 個 stops (用戶活動量偏好: ${intensityLabel})
   - 順序依時間: ${slotNames.join(" → ")} 各時段安排一個景點
   - 用戶選的活動量是硬性偏好, 即使候選池夠也不要超過上限
   - 候選池小或寧缺勿濫時, 可少到 ${minStops} 個 stops, **不要硬塞重複 POI**
3. 候選池含親子餐廳/觀光工廠等 category=restaurant 場館
   - 中午/晚上時段可以排親子餐廳 (有遊戲區那種), 但不是必須
   - 大多時段排景點 (park/museum/zoo/amusement/indoor) 即可
   - 不要硬塞餐廳湊數, 真有合適的再放
4. **同一天內不能重複用同一個 POI**
5. 一個 plan 內的 POI 地理距離要合理 (參考 district 欄位)
6. POI 年齡範圍要涵蓋小孩年齡

## 多樣性要求
- 2 個方案之間**至少要有 1 個 POI 不同**
- 如果候選池太小, 誠實只回 1 個方案, 寧缺勿濫
- 第一個 balanced (最貼合 vibes), 第二個 budget 或 premium 對比

## reason 撰寫
不要寫「適合小孩」這種泛泛的話, 要具體:
- ✅ 「6 歲已能爬完所有遊戲設施, 室內有遊戲區放電」
- ✅ 「公園免費, 旁邊有捷運站, 大人可坐著休息」

務必呼叫 create_plans 工具回傳結果.`;

  const userPrompt = `# 這個家庭

- ${d.kids === 0 ? `大人 ${d.adults} 人 (無小孩, 適合成人/情侶/長輩)` : `大人 ${d.adults} 人, 小孩 ${d.kids} 個 (${d.kidAges.join(",")} 歲)`}
- ${dateStr}出遊, 走 ${days} 天, 每天 ${minStops}-${perDay} 站 (活動量: ${intensityLabel})
- 從 ${d.startArea} 出發
- 偏好氛圍: ${vibesStr}
- 特殊需求: ${needsStr}
- 預算: NT$${budgetStr}
${d.notes ? `- 補充說明: ${d.notes}` : ""}
${d.destMode === "specific" ? `- 想去的地方: ${d.destAreas.join("、")}` : "- 目的地不限, 你決定最合適"}

# 可選 POI 池 (共 ${candidates.length} 筆, 含景點 + 親子餐廳)

${JSON.stringify(candidateJson, null, 1)}

請呼叫 create_plans 工具產生 2 個方案 (若候選不夠多樣可只回 1 個).`;

  const client = new Anthropic({
    apiKey: process.env.CHILDTRIP_ANTHROPIC_KEY,
    baseURL: "https://api.anthropic.com", // override Claude Code's ANTHROPIC_BASE_URL
  });

  const callClaude = async (
    messages: Anthropic.MessageParam[]
  ) =>
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      // ─── Prompt cache 預留 (流量起來後再啟用) ───────────────────────
      // 目前低流量 + system prompt 嵌可變參數 (minStops/perDay/intensityLabel/slotNames),
      // 不同用戶 cache key 不同 → 命中率 ~0, 反而吃 1.25x cache_write premium → 不划算.
      //
      // 啟用條件 (建議 ≥ 100 reqs/day 同時 ≤ 5 分鐘間隔再評估):
      //   1. 把 systemPrompt 拆成 [固定部分] + [可變部分]
      //      固定部分 (規則/範例/reason 標準) → 放 system position
      //      可變部分 (minStops/perDay/...) → 移到 user message 開頭
      //   2. 固定部分需 ≥ 2048 tokens (Haiku 4.5 cache 門檻), 若不夠就補範例
      //   3. 在固定部分末尾加 cache_control:
      //
      //      system: [
      //        { type: "text", text: FIXED_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }
      //      ],
      //
      //   4. 預期效益: cache_read 命中時, 固定部分按 0.1x 計價 (省 90%)
      //      若 1000 req/day 集中在週末早上, cache 命中率 ~60% → 整體再省 5-8%
      system: systemPrompt,
      messages,
      tools: [itineraryTool as Anthropic.Tool],
      tool_choice: { type: "tool", name: "create_plans" },
    });

  const extractToolUse = (resp: Anthropic.Message) => {
    const block = resp.content.find((b) => b.type === "tool_use");
    return block && block.type === "tool_use" ? block : null;
  };

  type ToolResult = {
    plans: Array<{
      theme: string;
      description: string;
      badge_type: "balanced" | "budget" | "premium";
      days: Array<{ stops: Array<{ poi_id: string; reason: string }> }>;
    }>;
  };

  const validIds = new Set(candidates.map((p) => p.id));
  const findInvalid = (r: ToolResult): string[] => {
    const bad: string[] = [];
    if (!r?.plans || !Array.isArray(r.plans)) return ["__MALFORMED_RESPONSE__"];
    for (const plan of r.plans) {
      if (!plan?.days || !Array.isArray(plan.days)) {
        bad.push("__MISSING_DAYS__");
        continue;
      }
      for (const day of plan.days) {
        if (!day?.stops || !Array.isArray(day.stops)) {
          bad.push("__MISSING_STOPS__");
          continue;
        }
        const seenInDay = new Set<string>();
        for (const stop of day.stops) {
          if (!stop?.poi_id || !validIds.has(stop.poi_id)) {
            bad.push(stop?.poi_id || "__MISSING_ID__");
          } else if (seenInDay.has(stop.poi_id)) {
            bad.push(`__DUP_IN_DAY__:${stop.poi_id}`);
          } else {
            seenInDay.add(stop.poi_id);
          }
        }
      }
    }
    return bad;
  };

  // First attempt
  let response: Anthropic.Message;
  try {
    response = await callClaude([{ role: "user", content: userPrompt }]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Claude API error:", msg);
    return NextResponse.json({ error: `Claude API error: ${msg}` }, { status: 502 });
  }

  let toolBlock = extractToolUse(response);
  if (!toolBlock) {
    return NextResponse.json({ error: "No tool_use in response" }, { status: 502 });
  }
  let ai = toolBlock.input as ToolResult;
  let invalid = findInvalid(ai);

  // Auto-retry once with explicit error feedback (catches LLM ID hallucination)
  if (invalid.length > 0) {
    console.warn(`Grounding fail attempt 1, retrying. Bad ids: ${invalid.join(", ")}`);
    const validExamples = candidates
      .slice(0, 5)
      .map((p) => `"${p.id}" (${p.name})`)
      .join(", ");
    const retryMsg = `你回的這些 poi_id 不在候選清單裡: ${invalid.join(", ")}.

請看清楚候選 list 內的 \`id\` 欄位, **逐字複製**, 不要自己改 prefix 或縮寫.

清單中正確的 id 例如: ${validExamples}.

重新呼叫 create_plans, 確保每個 poi_id 都精確等於候選清單中某筆的 id.`;

    try {
      response = await callClaude([
        { role: "user", content: userPrompt },
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolBlock.id,
              content: retryMsg,
              is_error: true,
            },
          ],
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Retry failed: ${msg}` }, { status: 502 });
    }

    toolBlock = extractToolUse(response);
    if (!toolBlock) {
      return NextResponse.json({ error: "No tool_use on retry" }, { status: 502 });
    }
    ai = toolBlock.input as ToolResult;
    invalid = findInvalid(ai);

    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "AI still hallucinated after retry", invalid },
        { status: 502 }
      );
    }
  }

  // Transform to client shape
  const badgeMeta = {
    balanced: { badge: "★ 最符合需求", badgeColor: "bg-orange-100 text-orange-700" },
    budget: { badge: "💰 省錢首選", badgeColor: "bg-emerald-100 text-emerald-700" },
    premium: { badge: "✨ 升級", badgeColor: "bg-violet-100 text-violet-700" },
  };

  // Deduplicate: drop any plan whose POI set matches an earlier plan
  const fingerprint = (p: typeof ai.plans[0]): string =>
    p.days
      .map((d) => [...d.stops.map((s) => s.poi_id)].sort().join(","))
      .join("|");
  const seenFps = new Set<string>();
  const dedupedAiPlans = ai.plans.filter((p) => {
    const fp = fingerprint(p);
    if (seenFps.has(fp)) return false;
    seenFps.add(fp);
    return true;
  });

  const plans = dedupedAiPlans.map((p, i) => {
    const meta = badgeMeta[p.badge_type] ?? badgeMeta.balanced;
    const days = p.days.map((day) => ({
      poiIds: day.stops.map((s) => s.poi_id),
    }));
    const reasons: Record<string, string> = {};
    p.days.forEach((day) => {
      day.stops.forEach((s) => {
        reasons[s.poi_id] = s.reason;
      });
    });
    const estimatedCost = days
      .flatMap((d) => d.poiIds)
      .reduce((sum, id) => {
        const poi = candidates.find((c) => c.id === id);
        return poi
          ? sum +
              Math.round((poi.priceMin + poi.priceMax) / 2) *
                (d.adults + d.kids || 1)
          : sum;
      }, 0);
    return {
      id: `plan_${p.badge_type}_${i}`,
      theme: p.theme,
      description: p.description,
      badge: meta.badge,
      badgeColor: meta.badgeColor,
      days,
      reasons,
      estimatedCost,
    };
  });

  // 內嵌 POI 完整資料 (id → Poi) 讓 client 不用再 query DB
  const usedIds = new Set<string>();
  for (const plan of plans) {
    for (const day of plan.days) for (const id of day.poiIds) usedIds.add(id);
  }
  const poiData: Record<string, Poi> = {};
  for (const c of candidates) {
    if (usedIds.has(c.id)) poiData[c.id] = c;
  }

  return NextResponse.json({
    plans,
    poiData,
    candidateCount: candidates.length,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens:
        (response.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0,
      cache_read_input_tokens:
        (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0,
    },
  });
}
