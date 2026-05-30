import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { pois, type Poi } from "@/lib/mock-data";

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

function filterCandidates(d: WizardData): Poi[] {
  const hasKids = d.kidAges.length > 0;
  const minAge = hasKids ? Math.min(...d.kidAges) : 0;
  const maxAge = hasKids ? Math.max(...d.kidAges) : 99;
  const startZone = REGION_ZONE[d.startArea] ?? "north";
  return pois.filter((p) => {
    if (hasKids && (p.ageMax < minAge || p.ageMin > maxAge)) return false;
    if (d.destMode === "specific") {
      const ok = d.destAreas.some(
        (a) => p.district.includes(a) || p.address?.includes(a) || p.name.includes(a)
      );
      if (!ok) return false;
    } else if (!zoneAllowed(startZone, poiZone(p), d.duration)) {
      return false;
    }
    return true;
  });
}

const numDays = (d: Duration) => (d === "d3n2" ? 3 : d === "d2n1" ? 2 : 1);
const slotsPerDay = (d: Duration) => (d === "half" ? 3 : 5);

// 計算每天 stops 範圍 (景點數 + 餐點)。intensity 主要控制「景點」, 用餐固定 1-3 個.
function stopRange(duration: Duration, intensity: Intensity = "auto"): { min: number; max: number } {
  const isHalf = duration === "half";
  // attractions per day (excluding meals)
  const attrRange = {
    chill:    isHalf ? { min: 1, max: 2 } : { min: 1, max: 2 },
    standard: isHalf ? { min: 2, max: 3 } : { min: 3, max: 3 },
    packed:   isHalf ? { min: 3, max: 4 } : { min: 4, max: 5 },
    auto:     isHalf ? { min: 2, max: 3 } : { min: 2, max: 4 },
  }[intensity];
  // meals per day: half=1-2, full=2-3
  const mealMin = isHalf ? 1 : 2;
  const mealMax = isHalf ? 2 : 3;
  return {
    min: attrRange.min + mealMin,
    max: attrRange.max + mealMax,
  };
}

const INTENSITY_LABEL: Record<Intensity, string> = {
  chill: "輕鬆 (1-2 個景點)",
  standard: "標準 (3 個景點)",
  packed: "充實 (4+ 個景點)",
  auto: "AI 自己決定",
};
const SLOT_FULL = ["早午餐", "上午景點", "點心 / 午茶", "下午景點", "晚餐"];
const SLOT_HALF = ["早午餐", "景點", "點心"];

// ────────────────────────────────────────────────────────────────────
// Claude tool schema (forces structured output)
// ────────────────────────────────────────────────────────────────────

const itineraryTool = {
  name: "create_three_plans",
  description: "Generate exactly 3 distinct family-trip itinerary plans from the candidate POIs.",
  input_schema: {
    type: "object" as const,
    properties: {
      plans: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        description: "1-3 distinct plans. Prefer 3 but if you cannot produce 3 meaningfully different plans (e.g. small candidate pool, all flavors converge), return fewer. Order by badge_type: balanced, budget, premium",
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

  const candidates = filterCandidates(d);
  if (candidates.length < 3) {
    return NextResponse.json(
      { error: "Not enough matching POIs", candidateCount: candidates.length },
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
  const mealLabelMap: Record<string, string> = { brunch: "早午餐", snack: "下午點心", dinner: "晚餐" };
  const mealsStr = d.meals.length > 0 ? d.meals.map((m) => mealLabelMap[m] ?? m).join("、") : "都不用排";
  const dateStr = { today: "今天", tomorrow: "明天", this_weekend: "這週末", next_weekend: "下週末" }[d.date];
  const budgetStr = {
    low: "<2,000", mid: "2,000-5,000", high: "5,000-10,000",
    premium: "10,000+", none: "沒上限",
  }[d.budget as keyof typeof budgetStr] ?? d.budget;

  const systemPrompt = `你是台灣親子行程規劃師, 幫忙產出 3 個風格不同的一日/多日行程方案.

## 嚴格規則 (違反一律 reject)
1. **只能從 candidate POI list 選 poi_id**, 絕對不可以編造不存在的 id
   - poi_id 必須**逐字複製**自候選 list 的 \`id\` 欄位 (character-by-character copy)
   - 候選 list 內 id 形如 \`poi_xxx\`, \`seed_tp_xxx\`, \`seed_ty_xxx\`, \`seed_nt_xxx\` 等
   - **每個字母都不能改**. 例如:
     - 看到 \`seed_ty_daxi\` 寫 \`seed_ty_daxi\` (不要寫成 seed_yt_daxi 或 seed_t_daxi)
     - 看到 \`poi_daanforest\` 寫 \`poi_daanforest\` (不要寫成 seed_daanforest)
   - 寫前**目視對照**候選 list 中的精確字串
2. 每天 ${minStops}-${perDay} 個 stops (用戶活動量偏好: ${intensityLabel})
   - 順序依時間: ${slotNames.join(" → ")} (用戶有勾的餐點 + 景點交錯)
   - 用戶選的活動量是**硬性偏好**, 即使候選池夠也不要超過上限
   - 候選池小或寧缺勿濫時, 可少到 ${minStops} 個 stops, **不要硬塞重複 POI**
3. category=restaurant 放在用戶要的餐點 slots, 其他類別放景點 slot
   - 用戶會在 user message 寫明「要排的餐點」, 你必須**每餐排 1 個 restaurant**
   - 用戶沒勾的餐點就不排
4. **同一天內不能重複用同一個 POI** (例如不能把龍潭大池排在早餐又排在晚餐, 走兩次)
5. 不同天的同一個 plan 內可以再去同一個 POI, 但盡量避免
5. 一個 plan 內的 POI 地理距離要合理 (參考 district 欄位)
6. POI 年齡範圍要涵蓋小孩年齡

## 多樣性硬性要求 (重要)
- 3 個方案之間**至少要有 2 個 POI 不同**, 否則不算「不同方案」
- 如果候選池太小, 或「最符合 vibe」剛好就是「最便宜」(常見 case), **誠實只回 1-2 個方案**
- 寧可給 1 個高品質方案, 不要硬塞 3 個重複的
- 用戶看到重複會覺得 app 廢, 看到「我只找到 1 個有意義不同方案」反而會信任

## 3 個方案的差異化 (如果候選夠多)
- **balanced**: 最貼合用戶選的 vibes, 預算落在中段
- **budget**: 多選免費或便宜場館, 預算優先 (若 balanced 已經是免費的, 就跳過此方案)
- **premium**: 高評價 (likes 高) 或精緻場館, 體驗最完整

## reason 撰寫要求
不要寫泛泛的話 (如「適合小孩」). 要具體, 例如:
- ❌ 「適合小朋友玩」
- ✅ 「6 歲已能爬完所有遊戲設施, 室內有遊戲區放電」
- ✅ 「公園免費, 旁邊有捷運站, 大人可以坐著休息」

務必呼叫 create_three_plans 工具回傳結果, 不要用純文字.`;

  const userPrompt = `# 這個家庭

- ${d.kids === 0 ? `大人 ${d.adults} 人 (無小孩, 適合成人/情侶/長輩)` : `大人 ${d.adults} 人, 小孩 ${d.kids} 個 (${d.kidAges.join(",")} 歲)`}
- ${dateStr}出遊, 走 ${days} 天, 每天 ${minStops}-${perDay} 站 (活動量: ${intensityLabel})
- 要排的餐點: ${mealsStr} (每餐用 1 個 restaurant POI, 必須符合用戶選的 meals)
- 從 ${d.startArea} 出發
- 偏好氛圍: ${vibesStr}
- 特殊需求: ${needsStr}
- 預算: NT$${budgetStr}
${d.notes ? `- 補充說明: ${d.notes}` : ""}
${d.destMode === "specific" ? `- 想去的地方: ${d.destAreas.join("、")}` : "- 目的地不限, 你決定最合適"}

# 可選 POI 池 (共 ${candidates.length} 筆)

${JSON.stringify(candidateJson, null, 1)}

請呼叫 create_three_plans 工具產生 3 個方案.`;

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
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
      // @ts-expect-error tool schema typed loose
      tools: [itineraryTool],
      tool_choice: { type: "tool", name: "create_three_plans" },
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

重新呼叫 create_three_plans, 確保每個 poi_id 都精確等於候選清單中某筆的 id.`;

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

  return NextResponse.json({
    plans,
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
