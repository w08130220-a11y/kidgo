"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Users,
  Baby,
  CalendarDays,
  MapPin,
  Clock,
  Wallet,
  Sun,
  Home as HomeIcon,
  PawPrint,
  GraduationCap,
  UtensilsCrossed,
  Zap,
  Plus,
  Minus,
  Check,
  RefreshCw,
  Bookmark,
  Share2,
  Phone,
  CalendarPlus,
  Moon,
  Map as MapIcon,
} from "lucide-react";
import { pois, categoryMeta, type Poi } from "@/lib/mock-data";

// ────────────────────────────────────────────────────────────────────
// Wizard data model
// ────────────────────────────────────────────────────────────────────

type DateChoice = "today" | "tomorrow" | "this_weekend" | "next_weekend";
type Duration = "half" | "full" | "d2n1" | "d3n2";
type Intensity = "chill" | "standard" | "packed" | "auto";
type Budget = "low" | "mid" | "high" | "premium" | "none";
type Vibe = "outdoor" | "indoor" | "animals" | "learning" | "food" | "energy";
type Meal = "brunch" | "snack" | "dinner";
type Need = "stroller" | "rainy" | "accessible" | "no_crowd" | "metro";
type DestMode = "any" | "specific";

type WizardData = {
  adults: number;
  kids: number;
  kidAges: number[];
  date: DateChoice;
  startArea: string;
  destMode: DestMode;
  destAreas: string[];
  duration: Duration;
  intensity: Intensity;
  budget: Budget;
  vibes: Vibe[];
  meals: Meal[];
  needs: Need[];
  notes: string;
};

const defaultData: WizardData = {
  adults: 2,
  kids: 1,
  kidAges: [5],
  date: "this_weekend",
  startArea: "臺北市",
  destMode: "any",
  destAreas: [],
  duration: "full",
  intensity: "auto",
  budget: "mid",
  vibes: [],
  meals: ["brunch", "snack", "dinner"],
  needs: [],
  notes: "",
};

const STEPS = ["出遊組合", "時間地點", "預算氛圍", "餐飲需求"] as const;

// ────────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [mode, setMode] = useState<"wizard" | "results">("wizard");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [generated, setGenerated] = useState<GeneratedPlan[] | null>(null);
  const [genSource, setGenSource] = useState<GenSource>("local");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const update = <K extends keyof WizardData>(k: K, v: WizardData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const canContinue = (s: number) => {
    if (s === 0) return data.adults > 0 && data.kidAges.length === data.kids;
    if (s === 1) {
      if (!data.startArea) return false;
      if (data.destMode === "specific" && data.destAreas.length === 0) return false;
      return true;
    }
    if (s === 2) return data.vibes.length >= 1;
    return true;
  };

  const [rateLimit, setRateLimit] = useState<{ remaining: number; resetAt: number; blocked: boolean } | null>(null);
  const [loginPrompt, setLoginPrompt] = useState<null | "save" | "share" | "calendar">(null);

  const handleSubmit = async () => {
    setMode("results");
    setIsThinking(true);
    setGenerated(null);
    setAiError(null);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Read rate limit headers regardless of status
      const remaining = parseInt(res.headers.get("X-RateLimit-Remaining") ?? "-1", 10);
      const resetAt = parseInt(res.headers.get("X-RateLimit-Reset") ?? "0", 10) * 1000;
      if (remaining >= 0) setRateLimit({ remaining, resetAt, blocked: res.status === 429 });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        setAiError(body.message ?? "今天 AI 規劃次數已用完, 明天再來");
        setGenerated([]);
        setGenSource("local");
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setGenerated(json.plans);
      setUsage(json.usage);
      setGenSource("ai");
    } catch (e) {
      // Fallback to rule-based
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("AI generation failed, falling back to rule-based:", msg);
      setAiError(msg);
      setGenerated(generatePlans(data));
      setGenSource("local");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="text-orange-500" size={18} />
            <span className="font-semibold">AI 規劃</span>
          </div>
          {mode === "wizard" && (
            <span className="ml-auto text-xs text-stone-500">
              第 {step + 1} / {STEPS.length} 步
            </span>
          )}
          {mode === "results" && (
            <div className="ml-auto flex items-center gap-3">
              {rateLimit && (
                <span
                  className={cx(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    rateLimit.remaining === 0
                      ? "bg-rose-100 text-rose-700"
                      : rateLimit.remaining <= 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-stone-100 text-stone-600"
                  )}
                  title="今日 AI 規劃剩餘次數 (登入後可解鎖更多)"
                >
                  今日剩 {rateLimit.remaining}/3 次
                </span>
              )}
              <button
                onClick={() => {
                  setMode("wizard");
                  setStep(0);
                }}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
              >
                <RefreshCw size={12} /> 重新規劃
              </button>
            </div>
          )}
        </div>
        {mode === "wizard" && (
          <div className="h-1 w-full bg-stone-100">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      {mode === "results" && isThinking ? (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-md">
            <Sparkles className="animate-pulse text-orange-500" size={20} />
            <span className="text-sm font-medium text-stone-700">
              Claude 思考中...
            </span>
            <ThinkingDots />
          </div>
          <p className="mt-4 max-w-xs text-xs text-stone-500">
            從 72 個全台親子場館中挑出最適合你的 3 套行程, 通常 3-8 秒
          </p>
        </main>
      ) : mode === "wizard" ? (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Step {step + 1}
          </div>
          <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{STEPS[step]}</h1>
          <p className="mb-8 text-sm text-stone-600">{subtitleFor(step)}</p>

          {step === 0 && <Step1Composition data={data} update={update} />}
          {step === 1 && <Step2TimePlace data={data} update={update} />}
          {step === 2 && <Step3BudgetVibe data={data} update={update} />}
          {step === 3 && <Step4MealsNeeds data={data} update={update} />}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-stone-200 pt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-30"
            >
              <ArrowLeft size={16} /> 上一步
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue(step)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:bg-stone-300 sm:flex-initial sm:px-8"
              >
                下一步 <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 sm:flex-initial sm:px-8"
              >
                <Sparkles size={16} /> 產生 3 個方案
              </button>
            )}
          </div>
        </main>
      ) : (
        <ResultsView
          data={data}
          plans={generated!}
          source={genSource}
          usage={usage}
          aiError={aiError}
          rateLimit={rateLimit}
          onLoginRequired={setLoginPrompt}
        />
      )}

      {loginPrompt && (
        <LoginPromptModal
          action={loginPrompt}
          onClose={() => setLoginPrompt(null)}
        />
      )}
    </div>
  );
}

function LoginPromptModal({
  action,
  onClose,
}: {
  action: "save" | "share" | "calendar";
  onClose: () => void;
}) {
  const titleMap = {
    save: "儲存行程需要登入",
    share: "分享行程需要登入",
    calendar: "加到行事曆需要登入",
  };
  const descMap = {
    save: "登入後可以儲存無限個行程，跨裝置同步，永遠找得到。",
    share: "登入後分享行程會帶上你的暱稱，其他爸媽看到還能追蹤你。",
    calendar: "登入讓我們知道是誰的行程。",
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="mt-3 text-lg font-bold">{titleMap[action]}</h2>
          <p className="mt-2 text-sm text-stone-600">{descMap[action]}</p>
        </div>

        <div className="mt-6 space-y-2">
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white opacity-60 cursor-not-allowed"
            title="LINE Login 即將上線"
          >
            <span className="text-base">💬</span> 用 LINE 登入
            <span className="text-[10px] font-normal rounded bg-emerald-700 px-1.5 py-0.5">即將上線</span>
          </button>
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 opacity-60 cursor-not-allowed"
            title="Google Login 即將上線"
          >
            <span className="text-base">🅖</span> 用 Google 登入
            <span className="text-[10px] font-normal text-stone-500">即將上線</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-stone-500">
          v1 內測階段登入功能尚未開放，正準備接 Supabase Auth。
          <br />
          現在你可以「加到行事曆」下載 .ics 檔離線儲存。
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg text-xs text-stone-500 hover:text-stone-900"
        >
          先不用，繼續看
        </button>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 [animation-delay:200ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400 [animation-delay:400ms]" />
    </span>
  );
}

function subtitleFor(s: number) {
  return {
    0: "幾個人出遊？孩子幾歲？沒帶小孩也可以（情侶/長輩同行）。",
    1: "什麼時候去？從哪、想去哪？走幾天？",
    2: "預算大概多少？想要什麼樣的氛圍？(可複選 1-3 個)",
    3: "要吃幾餐？有什麼特別需要的（推車、雨備等）？",
  }[s];
}

// ────────────────────────────────────────────────────────────────────
// Step 1 — Composition
// ────────────────────────────────────────────────────────────────────

function Step1Composition({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  const setKids = (n: number) => {
    update("kids", n);
    const ages = [...data.kidAges];
    while (ages.length < n) ages.push(5);
    while (ages.length > n) ages.pop();
    update("kidAges", ages);
  };

  return (
    <div className="space-y-8">
      <Field icon={<Users size={18} />} label="大人">
        <ChipGroup
          value={data.adults}
          onChange={(v) => update("adults", v)}
          options={[
            { value: 1, label: "1 人" },
            { value: 2, label: "2 人" },
            { value: 3, label: "3 人" },
            { value: 4, label: "4 人+" },
          ]}
        />
      </Field>

      <Field icon={<Baby size={18} />} label="小孩">
        <ChipGroup
          value={data.kids}
          onChange={setKids}
          options={[
            { value: 0, label: "沒小孩" },
            { value: 1, label: "1 個" },
            { value: 2, label: "2 個" },
            { value: 3, label: "3 個" },
            { value: 4, label: "4 個+" },
          ]}
        />

        {data.kids === 0 && (
          <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            👋 沒問題！會用「親子友善景點」幫你規劃，適合成人 / 情侶 / 帶長輩。
          </p>
        )}

        {data.kids > 0 && (
          <div className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-medium text-stone-600">
              告訴我每個孩子的年齡（年齡決定推薦哪些場館）
            </p>
            {Array.from({ length: data.kids }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-14 text-sm text-stone-700">第 {i + 1} 個</span>
                <NumberStepper
                  value={data.kidAges[i] ?? 5}
                  onChange={(v) => {
                    const next = [...data.kidAges];
                    next[i] = v;
                    update("kidAges", next);
                  }}
                  min={0}
                  max={15}
                  suffix="歲"
                />
              </div>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 2 — Time + From + To + Duration (改造)
// ────────────────────────────────────────────────────────────────────

type Region = { value: string; label: string };

const TAIWAN_REGIONS: { region: string; cities: Region[] }[] = [
  {
    region: "北部",
    cities: [
      { value: "基隆市", label: "基隆" },
      { value: "臺北市", label: "台北" },
      { value: "新北市", label: "新北" },
      { value: "桃園市", label: "桃園" },
      { value: "新竹市", label: "新竹市" },
      { value: "新竹縣", label: "新竹縣" },
      { value: "宜蘭縣", label: "宜蘭" },
    ],
  },
  {
    region: "中部",
    cities: [
      { value: "苗栗縣", label: "苗栗" },
      { value: "臺中市", label: "台中" },
      { value: "彰化縣", label: "彰化" },
      { value: "南投縣", label: "南投" },
      { value: "雲林縣", label: "雲林" },
    ],
  },
  {
    region: "南部",
    cities: [
      { value: "嘉義市", label: "嘉義市" },
      { value: "嘉義縣", label: "嘉義縣" },
      { value: "臺南市", label: "台南" },
      { value: "高雄市", label: "高雄" },
      { value: "屏東縣", label: "屏東" },
    ],
  },
  {
    region: "東部",
    cities: [
      { value: "花蓮縣", label: "花蓮" },
      { value: "臺東縣", label: "台東" },
    ],
  },
  {
    region: "離島",
    cities: [
      { value: "澎湖縣", label: "澎湖" },
      { value: "金門縣", label: "金門" },
      { value: "連江縣", label: "馬祖" },
    ],
  },
];

// 知名跨區景點 (目的地專用,出發地不需要)
const DESTINATION_LANDMARKS: Region[] = [
  { value: "陽明山", label: "陽明山" },
  { value: "淡水", label: "淡水" },
  { value: "八里", label: "八里" },
  { value: "九份", label: "九份" },
  { value: "平溪", label: "平溪" },
  { value: "烏來", label: "烏來" },
  { value: "金山", label: "金山" },
  { value: "鶯歌", label: "鶯歌" },
  { value: "日月潭", label: "日月潭" },
  { value: "清境", label: "清境農場" },
  { value: "溪頭", label: "溪頭" },
  { value: "阿里山", label: "阿里山" },
  { value: "墾丁", label: "墾丁" },
  { value: "太魯閣", label: "太魯閣" },
  { value: "綠島", label: "綠島" },
  { value: "蘭嶼", label: "蘭嶼" },
];

// All cities flat (for default value lookup etc)
const ALL_CITIES: Region[] = TAIWAN_REGIONS.flatMap((r) => r.cities);

function Step2TimePlace({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  const toggleDest = (a: string) => {
    const cur = data.destAreas;
    update("destAreas", cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]);
  };

  return (
    <div className="space-y-8">
      <Field icon={<CalendarDays size={18} />} label="什麼時候去">
        <ChipGroup
          value={data.date}
          onChange={(v) => update("date", v)}
          options={[
            { value: "today", label: "今天" },
            { value: "tomorrow", label: "明天" },
            { value: "this_weekend", label: "這週末" },
            { value: "next_weekend", label: "下週末" },
          ]}
        />
      </Field>

      <Field icon={<MapPin size={18} />} label="從哪裡出發">
        <div className="space-y-3">
          {TAIWAN_REGIONS.map(({ region, cities }) => (
            <div key={region}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                {region}
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {cities.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => update("startArea", c.value)}
                    className={cx(
                      "rounded-lg border px-2 py-1.5 text-sm transition",
                      data.startArea === c.value
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Field>

      <Field icon={<MapIcon size={18} />} label="想去哪裡">
        <ChipGroup
          value={data.destMode}
          onChange={(v) => update("destMode", v)}
          options={[
            { value: "any", label: "讓 AI 幫我決定 (推薦)" },
            { value: "specific", label: "我有想去的地方" },
          ]}
        />
        {data.destMode === "specific" && (
          <div className="mt-3 space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-medium text-stone-600">
              選一個或多個目的地（chip 多選）
            </p>

            {TAIWAN_REGIONS.map(({ region, cities }) => (
              <div key={region}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  {region}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map((c) => {
                    const active = data.destAreas.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        onClick={() => toggleDest(c.value)}
                        className={cx(
                          "rounded-full border px-3 py-1 text-xs transition",
                          active
                            ? "border-orange-500 bg-orange-500 text-white font-medium"
                            : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                        )}
                      >
                        {active ? "✓ " : ""}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                ✨ 知名景點
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DESTINATION_LANDMARKS.map((c) => {
                  const active = data.destAreas.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      onClick={() => toggleDest(c.value)}
                      className={cx(
                        "rounded-full border px-3 py-1 text-xs transition",
                        active
                          ? "border-amber-500 bg-amber-500 text-white font-medium"
                          : "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400"
                      )}
                    >
                      {active ? "✓ " : ""}
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {data.destAreas.length > 0 && (
              <p className="text-xs text-stone-500">
                已選 {data.destAreas.length} 個地方
              </p>
            )}
          </div>
        )}
      </Field>

      <Field icon={<Clock size={18} />} label="出遊長度">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { value: "half", label: "半天", desc: "約 4 小時" },
            { value: "full", label: "一整天", desc: "約 8 小時" },
            { value: "d2n1", label: "2 天 1 夜", desc: "週末過夜" },
            { value: "d3n2", label: "3 天 2 夜", desc: "連假深度" },
          ].map((o) => {
            const active = data.duration === o.value;
            return (
              <button
                key={o.value}
                onClick={() => update("duration", o.value as Duration)}
                className={cx(
                  "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition",
                  active
                    ? "border-orange-500 bg-orange-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <span className={cx("text-sm font-semibold", active && "text-orange-700")}>
                  {o.label}
                </span>
                <span className="text-[11px] text-stone-500">{o.desc}</span>
              </button>
            );
          })}
        </div>
        {(data.duration === "d2n1" || data.duration === "d3n2") && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <strong>多日行程 beta：</strong> AI 會幫你排各天景點 + 餐廳。
            <strong>夜晚住宿請自行安排</strong>（v1 不含住宿推薦）。
          </div>
        )}
      </Field>

      <Field icon={<Zap size={18} />} label="每天活動量 (不含用餐)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { value: "chill", label: "輕鬆", desc: "1-2 個景點" },
            { value: "standard", label: "標準", desc: "3 個景點" },
            { value: "packed", label: "充實", desc: "4+ 個景點" },
            { value: "auto", label: "AI 決定", desc: "依候選池" },
          ].map((o) => {
            const active = data.intensity === o.value;
            return (
              <button
                key={o.value}
                onClick={() => update("intensity", o.value as Intensity)}
                className={cx(
                  "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition",
                  active
                    ? "border-orange-500 bg-orange-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <span className={cx("text-sm font-semibold", active && "text-orange-700")}>
                  {o.label}
                </span>
                <span className="text-[11px] text-stone-500">{o.desc}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          帶小小孩選「輕鬆」、小學生「標準」、家長精力旺盛「充實」
        </p>
      </Field>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 3 — Budget + Vibe
// ────────────────────────────────────────────────────────────────────

const VIBE_OPTIONS: { value: Vibe; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "outdoor", label: "戶外大自然", icon: <Sun size={18} />, desc: "公園、河濱、山林" },
  { value: "indoor", label: "室內探索", icon: <HomeIcon size={18} />, desc: "博物館、室內樂園" },
  { value: "animals", label: "動物互動", icon: <PawPrint size={18} />, desc: "動物園、水族館" },
  { value: "learning", label: "學習教育", icon: <GraduationCap size={18} />, desc: "科教館、體驗工坊" },
  { value: "food", label: "親子美食", icon: <UtensilsCrossed size={18} />, desc: "餐廳有遊戲區" },
  { value: "energy", label: "純放電", icon: <Zap size={18} />, desc: "讓孩子跑跳放電" },
];

function Step3BudgetVibe({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  const toggleVibe = (v: Vibe) => {
    const cur = data.vibes;
    if (cur.includes(v)) update("vibes", cur.filter((x) => x !== v));
    else if (cur.length < 3) update("vibes", [...cur, v]);
  };

  return (
    <div className="space-y-8">
      <Field icon={<Wallet size={18} />} label="全家總預算">
        <ChipGroup
          value={data.budget}
          onChange={(v) => update("budget", v)}
          options={[
            { value: "low", label: "< 2,000" },
            { value: "mid", label: "2,000 – 5,000" },
            { value: "high", label: "5,000 – 10,000" },
            { value: "premium", label: "10,000+" },
            { value: "none", label: "沒上限" },
          ]}
        />
        <p className="mt-2 text-xs text-stone-500">
          {data.duration === "d2n1" || data.duration === "d3n2"
            ? "每天平均，不含住宿"
            : "包含吃、玩、門票（不含交通油錢）"}
        </p>
      </Field>

      <Field icon={<Sparkles size={18} />} label="今天想要的氛圍 (選 1-3 個)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VIBE_OPTIONS.map((v) => {
            const active = data.vibes.includes(v.value);
            const disabled = !active && data.vibes.length >= 3;
            return (
              <button
                key={v.value}
                onClick={() => toggleVibe(v.value)}
                disabled={disabled}
                className={cx(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                  active
                    ? "border-orange-500 bg-orange-50"
                    : "border-stone-200 bg-white hover:border-stone-300",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                <div className="flex w-full items-start justify-between">
                  <span className={active ? "text-orange-600" : "text-stone-500"}>
                    {v.icon}
                  </span>
                  {active && (
                    <span className="rounded-full bg-orange-500 p-0.5 text-white">
                      <Check size={11} />
                    </span>
                  )}
                </div>
                <span className={cx("text-sm font-semibold", active && "text-orange-700")}>
                  {v.label}
                </span>
                <span className="text-[11px] text-stone-500">{v.desc}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          已選 {data.vibes.length} / 3
        </p>
      </Field>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 4 — Meals + Special needs
// ────────────────────────────────────────────────────────────────────

const MEAL_OPTIONS: { value: Meal; label: string }[] = [
  { value: "brunch", label: "早午餐" },
  { value: "snack", label: "下午點心" },
  { value: "dinner", label: "晚餐" },
];

const NEED_OPTIONS: { value: Need; label: string }[] = [
  { value: "stroller", label: "推車友善" },
  { value: "rainy", label: "雨天備案" },
  { value: "accessible", label: "無障礙" },
  { value: "no_crowd", label: "避開人潮" },
  { value: "metro", label: "捷運可達" },
];

function Step4MealsNeeds({
  data,
  update,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
}) {
  const toggleArr = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-8">
      <Field icon={<UtensilsCrossed size={18} />} label="要包含哪幾餐">
        <div className="grid grid-cols-3 gap-2">
          {MEAL_OPTIONS.map((m) => {
            const active = data.meals.includes(m.value);
            return (
              <button
                key={m.value}
                onClick={() => update("meals", toggleArr(data.meals, m.value))}
                className={cx(
                  "rounded-xl border px-3 py-3 text-sm font-medium transition",
                  active
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                )}
              >
                {active && <Check size={14} className="mr-1 inline" />}
                {m.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field icon={<Check size={18} />} label="特殊需求 (可跳過)">
        <div className="flex flex-wrap gap-2">
          {NEED_OPTIONS.map((n) => {
            const active = data.needs.includes(n.value);
            return (
              <button
                key={n.value}
                onClick={() => update("needs", toggleArr(data.needs, n.value))}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-sm transition",
                  active
                    ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                )}
              >
                {active ? "✓ " : "+ "}
                {n.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field icon={<Sparkles size={18} />} label="還有什麼想補充 (可跳過)">
        <textarea
          value={data.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="例如：哥哥不愛動物 / 媽媽腳受傷不能走太多 / 想拍照打卡的點"
          rows={3}
          className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none transition focus:border-orange-400"
        />
      </Field>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Results — 3 generated plans
// ────────────────────────────────────────────────────────────────────

type Day = { poiIds: string[] };
type GeneratedPlan = {
  id: string;
  theme: string;
  description: string;
  badge: string;
  badgeColor: string;
  days: Day[];
  estimatedCost: number;
  reasons?: Record<string, string>; // AI 推薦理由 (poi_id → reason)
};

type GenSource = "ai" | "local";
type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
};

function ResultsView({
  data,
  plans,
  source,
  usage,
  aiError,
  rateLimit,
  onLoginRequired,
}: {
  data: WizardData;
  plans: GeneratedPlan[];
  source: GenSource;
  usage: Usage | null;
  aiError: string | null;
  rateLimit: { remaining: number; resetAt: number; blocked: boolean } | null;
  onLoginRequired: (action: "save" | "share") => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = plans.find((p) => p.id === selectedId);
  const coverage = inventoryCoverage(data);

  // Rate limited (0 plans, blocked) — special empty state
  if (rateLimit?.blocked && plans.length === 0) {
    const hoursLeft = Math.ceil((rateLimit.resetAt - Date.now()) / (60 * 60 * 1000));
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-6xl">🛑</div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">今天 3 次規劃用完了</h1>
        <p className="mt-3 max-w-md text-sm text-stone-600">
          AI 規劃資源有限, 每天 3 次. 約 <strong>{hoursLeft} 小時</strong>後重置.
        </p>
        <p className="mt-2 max-w-md text-xs text-stone-500">
          v1 內測階段每位用戶都一樣 (不論有沒有登入). 之後訂閱版會給更多次。
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/poi"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            先逛景點
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            回首頁
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
        <Sparkles size={14} /> AI 為你產生的 3 個方案
        {source === "ai" && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
            ⚡ Claude Haiku 4.5
          </span>
        )}
        {source === "local" && (
          <span
            className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600"
            title={aiError ?? "rule-based fallback"}
          >
            🔧 規則排序 (fallback)
          </span>
        )}
      </div>
      <h1 className="text-2xl font-bold sm:text-3xl">挑一個你最喜歡的</h1>
      <p className="mt-2 text-sm text-stone-600">{summarizeData(data)}</p>

      {usage && source === "ai" && (
        <p className="mt-1 text-[11px] text-stone-400">
          tokens: in {usage.input_tokens.toLocaleString()} (cache hit{" "}
          {usage.cache_read_input_tokens.toLocaleString()}) · out{" "}
          {usage.output_tokens.toLocaleString()}
        </p>
      )}

      {aiError && source === "local" && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          ⚠ Claude API 暫時無法回應 ({aiError})，已自動切回規則排序。功能完整可用。
        </div>
      )}

      {plans.length < 3 && source === "ai" && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          💡 你選的條件下，AI 只找到 {plans.length} 個{plans.length === 1 ? "" : "彼此明顯不同的"}方案
          {plans.length === 1 ? "（最佳解很明確）" : "（其他組合都會跟這幾個太相似）"}
          。想看更多選項？試試放寬偏好（增加 vibe、放寬預算、或改成「讓 AI 幫我決定」目的地）。
        </div>
      )}

      {!coverage.enough && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            ⚠ {coverage.requestedLabel} 我們資料還不夠多
          </p>
          <p className="mt-1 text-xs text-amber-800">
            v1 內測階段 POI 主要集中北部。先用其他地區的相似條件景點給你參考 ...
            想搶先收到該地新景點？
            <Link href="/waitlist" className="ml-1 underline font-medium">
              留 email 我們上線通知你
            </Link>
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            selected={selectedId === p.id}
            onSelect={() => setSelectedId(p.id)}
          />
        ))}
      </div>

      {selected && (
        <PlanDetailStateful plan={selected} data={data} onLoginRequired={onLoginRequired} />
      )}
    </main>
  );
}

const SLOT_LABELS_FULL = ["早午餐", "上午景點", "點心 / 午茶", "下午景點", "晚餐"];
const SLOT_LABELS_HALF = ["早午餐", "景點", "點心"];

function slotLabelsFor(duration: Duration): string[] {
  return duration === "half" ? SLOT_LABELS_HALF : SLOT_LABELS_FULL;
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: GeneratedPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  const totalStops = plan.days.reduce((s, d) => s + d.poiIds.length, 0);
  const firstDayItems = plan.days[0].poiIds
    .map((id) => pois.find((p) => p.id === id))
    .filter((p): p is Poi => Boolean(p));

  return (
    <button
      onClick={onSelect}
      className={cx(
        "group flex flex-col gap-3 rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition",
        selected
          ? "border-orange-500 shadow-lg"
          : "border-stone-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold", plan.badgeColor)}>
          {plan.badge}
        </span>
        {selected && (
          <span className="rounded-full bg-orange-500 p-1 text-white">
            <Check size={14} />
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold leading-snug">{plan.theme}</h3>
      <p className="text-xs text-stone-600">{plan.description}</p>

      {plan.days.length > 1 && (
        <p className="text-xs font-medium text-stone-500">
          第 1 天預覽（共 {plan.days.length} 天）
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {firstDayItems.slice(0, 4).map((p, i) => {
          const meta = categoryMeta(p.category);
          return (
            <div
              key={`${p.id}-${i}`}
              className="flex items-center gap-2 truncate rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs"
            >
              <span className="text-base leading-none">{meta.emoji}</span>
              <span className="truncate text-stone-700">{p.name}</span>
            </div>
          );
        })}
        {firstDayItems.length > 4 && (
          <div className="text-center text-[11px] text-stone-400">
            … 還有 {firstDayItems.length - 4} 站
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
        <span className="text-stone-500">
          {plan.days.length > 1 ? `${plan.days.length} 天` : ""} {totalStops} 站
        </span>
        <span className="font-bold text-stone-900">
          {plan.estimatedCost === 0 ? "免費" : `約 NT$${plan.estimatedCost.toLocaleString()}`}
        </span>
      </div>
    </button>
  );
}

// Stateful wrapper for PlanDetail — allows swap to mutate displayed POIs
function PlanDetailStateful({
  plan,
  data,
  onLoginRequired,
}: {
  plan: GeneratedPlan;
  data: WizardData;
  onLoginRequired: (action: "save" | "share") => void;
}) {
  const [days, setDays] = useState<Day[]>(plan.days);

  const swap = (dayIdx: number, slotIdx: number) => {
    const currentId = days[dayIdx].poiIds[slotIdx];
    const currentPoi = pois.find((p) => p.id === currentId);
    if (!currentPoi) return;

    const allUsed = new Set(days.flatMap((d) => d.poiIds));
    const hasKids = data.kidAges.length > 0;
    const minAge = hasKids ? Math.min(...data.kidAges) : 0;
    const maxAge = hasKids ? Math.max(...data.kidAges) : 99;

    const candidates = pois.filter(
      (p) =>
        !allUsed.has(p.id) &&
        p.category === currentPoi.category &&
        (!hasKids || (p.ageMin <= maxAge && p.ageMax >= minAge))
    );

    if (candidates.length === 0) {
      // Loosen criteria: same category, ignore age
      const loose = pois.filter((p) => !allUsed.has(p.id) && p.category === currentPoi.category);
      if (loose.length === 0) {
        alert("沒有其他符合條件的選項可換 :(");
        return;
      }
      candidates.push(...loose);
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setDays((d) => {
      const next = d.map((day) => ({ poiIds: [...day.poiIds] }));
      next[dayIdx].poiIds[slotIdx] = pick.id;
      return next;
    });
  };

  const handleExportICS = () => {
    const ics = generateICS({ ...plan, days }, data);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `childtrip-${plan.theme}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-8 rounded-2xl border-2 border-orange-300 bg-white p-6 shadow-lg sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">✓ 你選了：{plan.theme}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportICS}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <CalendarPlus size={13} /> 加到行事曆
          </button>
          <button
            onClick={() => onLoginRequired("share")}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <Share2 size={13} /> 分享
          </button>
          <button
            onClick={() => onLoginRequired("save")}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
          >
            <Bookmark size={13} /> 儲存
          </button>
        </div>
      </div>

      {days.map((day, dayIdx) => (
        <div key={dayIdx}>
          {dayIdx > 0 && (
            <div className="my-6 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
              <Moon size={16} />
              <span className="font-semibold">第 {dayIdx} 晚請自行安排住宿</span>
              <span className="text-xs text-violet-700">(v1 暫不含住宿推薦)</span>
            </div>
          )}
          {days.length > 1 && (
            <div className="mb-3 mt-2 flex items-center gap-2">
              <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white">
                Day {dayIdx + 1}
              </span>
              <span className="text-xs text-stone-500">
                {SLOT_LABELS_FULL.length} 站行程
              </span>
            </div>
          )}
          <DayTimeline
            poiIds={day.poiIds}
            slotLabels={slotLabelsFor(data.duration)}
            onSwap={(slotIdx) => swap(dayIdx, slotIdx)}
            reasons={plan.reasons}
          />
        </div>
      ))}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
        💡 <strong>使用提示：</strong>
        <ul className="ml-4 mt-1 list-disc space-y-0.5">
          <li>點 <RefreshCw size={11} className="inline" /> 換一個</li>
          <li>標 <span className="rounded bg-amber-100 px-1 text-amber-700">需訂位</span> 的記得先打電話確認，滿了再按換一個</li>
          <li>點 <CalendarPlus size={11} className="inline" /> 加到行事曆 會下載 .ics 檔, 可導入 Google Calendar / Apple Calendar</li>
        </ul>
      </div>
    </div>
  );
}

function DayTimeline({
  poiIds,
  slotLabels,
  onSwap,
  reasons,
}: {
  poiIds: string[];
  slotLabels: string[];
  onSwap: (slotIdx: number) => void;
  reasons?: Record<string, string>;
}) {
  return (
    <ol className="space-y-3">
      {poiIds.map((id, i) => {
        const p = pois.find((x) => x.id === id);
        if (!p) return null;
        const meta = categoryMeta(p.category);
        return (
          <li
            key={`${id}-${i}`}
            className="flex gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-stone-500">
                {slotLabels[i] ?? `Stop ${i + 1}`}
              </span>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-2xl text-white shadow`}
              >
                {meta.emoji}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold leading-tight">{p.name}</h4>
                  {p.requiresReservation && (
                    <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      ⚠ 需訂位
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onSwap(i)}
                  title="換一個"
                  className="rounded-full p-1.5 text-stone-400 transition hover:bg-white hover:text-orange-600"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                <span>{p.district}</span>
                <span>{Math.round(p.durationMin / 60)}h</span>
                <span>{p.priceMin === 0 && p.priceMax === 0 ? "免費" : `NT$${p.priceMin}+`}</span>
              </p>

              <p className="mt-1.5 text-sm text-stone-700">{p.description}</p>

              {reasons?.[p.id] && (
                <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs text-violet-900">
                  <span className="font-semibold">✨ AI 為你選這裡：</span>
                  {reasons[p.id]}
                </div>
              )}

              {p.phone && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${p.phone.replace(/-/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Phone size={11} /> {p.phone}
                  </a>
                  {p.address && (
                    <a
                      href={`https://maps.google.com/maps?q=${encodeURIComponent(p.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
                    >
                      <MapPin size={11} /> 在 Maps 開啟
                    </a>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ────────────────────────────────────────────────────────────────────
// Plan generator
// ────────────────────────────────────────────────────────────────────

function inventoryCoverage(d: WizardData): { enough: boolean; requestedLabel: string } {
  if (d.destMode === "any") return { enough: true, requestedLabel: "" };
  const hasKids = d.kidAges.length > 0;
  const minAge = hasKids ? Math.min(...d.kidAges) : 0;
  const maxAge = hasKids ? Math.max(...d.kidAges) : 99;
  const matching = pois.filter(
    (p) =>
      (!hasKids || (p.ageMin <= maxAge && p.ageMax >= minAge)) &&
      d.destAreas.some(
        (a) => p.district.includes(a) || p.address?.includes(a) || p.name.includes(a)
      )
  );
  const needed = slotsPerDay(d.duration) * numDays(d.duration);
  // Use cityLabel for display
  const labels = d.destAreas
    .map(
      (v) =>
        ALL_CITIES.find((c) => c.value === v)?.label ??
        DESTINATION_LANDMARKS.find((c) => c.value === v)?.label ??
        v
    )
    .slice(0, 3)
    .join("、");
  return {
    enough: matching.length >= needed,
    requestedLabel: labels + (d.destAreas.length > 3 ? "..." : ""),
  };
}

// ────────────────────────────────────────────────────────────────────
// Geographic clustering — 防止「台北出發 1 日遊推薦墾丁」
// ────────────────────────────────────────────────────────────────────

type Zone = "north" | "central" | "south" | "east" | "island";

const REGION_ZONE: Record<string, Zone> = {
  // 北部
  "基隆市": "north", "臺北市": "north", "新北市": "north",
  "桃園市": "north", "新竹市": "north", "新竹縣": "north",
  "宜蘭縣": "north",
  // 中部
  "苗栗縣": "central", "臺中市": "central", "彰化縣": "central",
  "南投縣": "central", "雲林縣": "central",
  // 南部
  "嘉義市": "south", "嘉義縣": "south", "臺南市": "south",
  "高雄市": "south", "屏東縣": "south",
  // 東部
  "花蓮縣": "east", "臺東縣": "east",
  // 離島
  "澎湖縣": "island", "金門縣": "island", "連江縣": "island",
};

const ADJACENT_ZONES: Record<Zone, Zone[]> = {
  north: ["central"],
  central: ["north", "south"],
  south: ["central", "east"],
  east: ["south", "central"],
  island: [],
};

function poiZone(p: Poi): Zone | null {
  // Try address first (more complete), fall back to district
  for (const region of Object.keys(REGION_ZONE)) {
    if (p.address?.includes(region) || p.district.includes(region)) {
      return REGION_ZONE[region];
    }
  }
  return null;
}

function zoneAllowed(startZone: Zone, pZone: Zone | null, duration: Duration): boolean {
  if (!pZone) return true; // unknown zone, don't penalize
  if (pZone === startZone) return true;

  const isAdjacent = ADJACENT_ZONES[startZone]?.includes(pZone);

  if (duration === "half" || duration === "full") {
    // 1 日遊: 嚴格, 只能同 zone (不允許相鄰, 開車單程 1.5 小時 以內才合理)
    return false;
  }
  if (duration === "d2n1") {
    // 2 天 1 夜: 允許相鄰
    return isAdjacent;
  }
  // 3 天 2 夜+: 任何 zone
  return true;
}

function numDays(d: Duration): number {
  return d === "d3n2" ? 3 : d === "d2n1" ? 2 : 1;
}

function slotsPerDay(d: Duration): number {
  return d === "half" ? 3 : 5;
}

function generatePlans(d: WizardData): GeneratedPlan[] {
  const wantRainy = d.needs.includes("rainy") || d.vibes.includes("indoor");
  const wantFree = d.budget === "low";

  const planA: GeneratedPlan = {
    id: "plan_a",
    theme: "平衡推薦",
    description: "最貼合你選的氛圍，預算落在中段。多數爸媽的安全選擇。",
    badge: "★ 最符合需求",
    badgeColor: "bg-orange-100 text-orange-700",
    days: buildDays(d, "balanced"),
    estimatedCost: 0,
  };

  const planB: GeneratedPlan = {
    id: "plan_b",
    theme: wantFree ? "免費版" : "經濟實惠版",
    description: wantFree
      ? "0 元也能玩整天。公園 + 自帶餐點 + 免費場館。"
      : "同樣的氛圍，預算砍 30%。多選免費場館、平價親子餐廳。",
    badge: "💰 省錢首選",
    badgeColor: "bg-emerald-100 text-emerald-700",
    days: buildDays(d, "budget"),
    estimatedCost: 0,
  };

  const planC: GeneratedPlan = {
    id: "plan_c",
    theme: wantRainy ? "雨天備案版" : "精選升級版",
    description: wantRainy
      ? "全室內，下雨也不怕。預算稍微高一點，但體驗最完整。"
      : "加入更精選的場館跟人氣餐廳。預算多 20%，但回憶值翻倍。",
    badge: wantRainy ? "☔ 雨備" : "✨ 升級",
    badgeColor: "bg-violet-100 text-violet-700",
    days: buildDays(d, wantRainy ? "rainy" : "premium"),
    estimatedCost: 0,
  };

  [planA, planB, planC].forEach((plan) => {
    plan.estimatedCost = plan.days
      .flatMap((day) => day.poiIds)
      .reduce((sum, id) => {
        const p = pois.find((x) => x.id === id);
        return p ? sum + Math.round((p.priceMin + p.priceMax) / 2) * (d.adults + d.kids) : sum;
      }, 0);
  });

  return [planA, planB, planC];
}

type Flavor = "balanced" | "budget" | "rainy" | "premium";

function buildDays(d: WizardData, flavor: Flavor): Day[] {
  const days: Day[] = [];
  const usedIds = new Set<string>();
  const dayCount = numDays(d.duration);
  const perDay = slotsPerDay(d.duration);

  for (let i = 0; i < dayCount; i++) {
    const slots = pickSlots(d, flavor, perDay, usedIds);
    slots.forEach((id) => usedIds.add(id));
    days.push({ poiIds: slots });
  }
  return days;
}

function pickSlots(
  d: WizardData,
  flavor: Flavor,
  count: number,
  exclude: Set<string>
): string[] {
  const hasKids = d.kidAges.length > 0;
  const minAge = hasKids ? Math.min(...d.kidAges) : 0;
  const maxAge = hasKids ? Math.max(...d.kidAges) : 99;

  const ageOK = (p: Poi) => !hasKids || (p.ageMin <= maxAge && p.ageMax >= minAge);

  const matchesDest = (p: Poi) =>
    d.destMode === "any" ||
    d.destAreas.some(
      (a) => p.district.includes(a) || p.address?.includes(a) || p.name.includes(a)
    );

  // 距離 filter: destMode=specific 時尊重用戶 (跳過 zone 檢查)
  // destMode=any 時依 duration 嚴格度限制可選 zone
  const startZone = REGION_ZONE[d.startArea] ?? "north";
  const passesZone = (p: Poi) =>
    d.destMode === "specific" || zoneAllowed(startZone, poiZone(p), d.duration);

  const matching = pois.filter(
    (p) => !exclude.has(p.id) && ageOK(p) && matchesDest(p) && passesZone(p)
  );
  const fallback = pois.filter((p) => !exclude.has(p.id) && ageOK(p) && passesZone(p));

  const pool = matching.length >= count ? matching : fallback;
  const restaurants = pool.filter((p) => p.category === "restaurant");
  const attractions = pool.filter((p) => p.category !== "restaurant");

  let attrSorted: Poi[];
  let restSorted: Poi[];

  if (flavor === "budget") {
    attrSorted = sortBy(attractions, (p) => p.priceMin + p.priceMax);
    restSorted = sortBy(restaurants, (p) => p.priceMin + p.priceMax);
  } else if (flavor === "rainy") {
    const indoor = (arr: Poi[]) =>
      arr.filter(
        (p) =>
          p.tags.includes("室內") ||
          p.tags.includes("雨天備案") ||
          p.tags.includes("雨天首選")
      );
    attrSorted = indoor(attractions).concat(attractions);
    restSorted = indoor(restaurants).concat(restaurants);
  } else if (flavor === "premium") {
    attrSorted = sortBy(attractions, (p) => -p.likes);
    restSorted = sortBy(restaurants, (p) => -p.likes);
  } else {
    const score = (p: Poi): number => {
      let s = 0;
      if (d.vibes.includes("outdoor") && (p.category === "park" || p.tags.includes("戶外"))) s += 3;
      if (d.vibes.includes("indoor") && p.tags.includes("室內")) s += 3;
      if (d.vibes.includes("animals") && p.category === "zoo") s += 3;
      if (d.vibes.includes("learning") && p.category === "museum") s += 3;
      if (d.vibes.includes("food") && p.category === "restaurant") s += 2;
      if (d.vibes.includes("energy") && (p.category === "park" || p.category === "amusement")) s += 3;
      if (d.needs.includes("stroller") && p.tags.includes("推車友善")) s += 1;
      if (d.needs.includes("metro") && p.tags.includes("捷運直達")) s += 1;
      if (d.needs.includes("no_crowd") && p.tags.includes("平日人少")) s += 1;
      return s;
    };
    attrSorted = sortBy(attractions, (p) => -score(p));
    restSorted = sortBy(restaurants, (p) => -score(p));
  }

  const dedup = (a: Poi[]): Poi[] => {
    const seen = new Set<string>();
    const out: Poi[] = [];
    for (const p of a) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  };
  attrSorted = dedup(attrSorted);
  restSorted = dedup(restSorted);

  const out: string[] = [];
  const pushUnique = (id: string | undefined) => {
    if (id && !out.includes(id)) out.push(id);
  };

  if (count === 3) {
    // half day: brunch + attr + snack-or-attr
    pushUnique(restSorted[0]?.id);
    pushUnique(attrSorted[0]?.id);
    pushUnique(restSorted[1]?.id ?? attrSorted[1]?.id);
  } else {
    // full day (5 slots): brunch + attr + snack + attr + dinner
    pushUnique(restSorted[0]?.id);
    pushUnique(attrSorted[0]?.id);
    pushUnique(attrSorted[1]?.id);
    pushUnique(attrSorted[2]?.id);
    pushUnique(restSorted[1]?.id ?? attrSorted[3]?.id);
  }

  // Pad if short
  for (const p of [...attrSorted, ...restSorted]) {
    if (out.length >= count) break;
    pushUnique(p.id);
  }

  return out.slice(0, count);
}

function sortBy<T>(arr: T[], fn: (x: T) => number): T[] {
  return [...arr].sort((a, b) => fn(a) - fn(b));
}

// ────────────────────────────────────────────────────────────────────
// ICS calendar export
// ────────────────────────────────────────────────────────────────────

function deriveBaseDate(choice: DateChoice): Date {
  const now = new Date();
  if (choice === "today") return now;
  if (choice === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  // weekend = next Saturday
  const d = new Date(now);
  const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat + (choice === "next_weekend" ? 7 : 0));
  return d;
}

function fmtICSDate(d: Date): string {
  // YYYYMMDDTHHmmssZ in UTC
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function generateICS(plan: GeneratedPlan, data: WizardData): string {
  const base = deriveBaseDate(data.date);
  const events: string[] = [];
  const stamp = fmtICSDate(new Date());

  plan.days.forEach((day, dayIdx) => {
    const dayDate = new Date(base);
    dayDate.setDate(dayDate.getDate() + dayIdx);
    dayDate.setHours(10, 0, 0, 0); // start each day at 10am local

    let cursor = new Date(dayDate);

    day.poiIds.forEach((id, slotIdx) => {
      const p = pois.find((x) => x.id === id);
      if (!p) return;
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + p.durationMin * 60000);

      const slotLabel = slotLabelsFor(data.duration)[slotIdx] ?? `Stop ${slotIdx + 1}`;
      const summary = `${slotLabel} — ${p.name}`;
      const description = [
        p.description,
        p.phone ? `☎ ${p.phone}` : "",
        p.requiresReservation ? "⚠ 需先訂位" : "",
        p.estimatedKid ? `孩子心得：${p.estimatedKid}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      events.push(
        [
          "BEGIN:VEVENT",
          `UID:${plan.id}-d${dayIdx}-s${slotIdx}@childtrip.tw`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${fmtICSDate(start)}`,
          `DTEND:${fmtICSDate(end)}`,
          `SUMMARY:${escapeICS(summary)}`,
          `LOCATION:${escapeICS(p.address || p.district)}`,
          `DESCRIPTION:${escapeICS(description)}`,
          "END:VEVENT",
        ].join("\r\n")
      );

      // advance with 30 min buffer for travel
      cursor = new Date(end.getTime() + 30 * 60000);
    });
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ChildTrip//AI//ZH-TW",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

// ────────────────────────────────────────────────────────────────────
// Shared UI bits
// ────────────────────────────────────────────────────────────────────

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
        <span className="text-stone-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipGroup<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-full border px-4 py-2 text-sm transition",
            value === o.value
              ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
              : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="rounded-md p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[40px] text-center text-sm font-medium">
        {value}
        {suffix && <span className="ml-0.5 text-xs text-stone-500">{suffix}</span>}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="rounded-md p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function summarizeData(d: WizardData): string {
  const parts: string[] = [];
  parts.push(
    d.kids === 0
      ? `${d.adults} 位大人 (無小孩)`
      : `${d.adults} 大 ${d.kids} 小 (${d.kidAges.join(",")} 歲)`
  );
  const dateMap: Record<DateChoice, string> = {
    today: "今天",
    tomorrow: "明天",
    this_weekend: "這週末",
    next_weekend: "下週末",
  };
  parts.push(dateMap[d.date]);
  const durMap: Record<Duration, string> = {
    half: "半天",
    full: "一整天",
    d2n1: "2 天 1 夜",
    d3n2: "3 天 2 夜",
  };
  parts.push(durMap[d.duration]);
  const intensityMap: Record<Intensity, string> = {
    chill: "輕鬆", standard: "標準", packed: "充實", auto: "AI 排",
  };
  if (d.intensity && d.intensity !== "auto") parts.push(`${intensityMap[d.intensity]}活動量`);
  parts.push(`從 ${d.startArea}`);
  if (d.destMode === "specific" && d.destAreas.length > 0) {
    parts.push(`去 ${d.destAreas.slice(0, 3).join("/")}${d.destAreas.length > 3 ? "..." : ""}`);
  }
  const budgetMap: Record<Budget, string> = {
    low: "<2k",
    mid: "2-5k",
    high: "5-10k",
    premium: "10k+",
    none: "不限",
  };
  parts.push(`預算 ${budgetMap[d.budget]}`);
  if (d.vibes.length > 0) {
    parts.push(d.vibes.map((v) => VIBE_OPTIONS.find((o) => o.value === v)?.label).join("/"));
  }
  return parts.join(" ・ ");
}

function cx(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
