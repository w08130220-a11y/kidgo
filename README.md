# ChildTrip / KidGo

> 台灣親子週末小旅行 AI 規劃工具
>
> 雙薪父母告訴 AI 小孩年齡 + 預算 + 想要的氛圍, 30 秒生出完整一日行程 (早午餐 → 景點 → 點心 → 景點 → 晚餐), 每筆 POI 都附 AI 為這個家庭挑選的理由.

## Features

- **AI 規劃** (Claude Haiku 4.5): 4 步 wizard → 3 個風格不同的方案 (平衡 / 省錢 / 升級)
- **Grounded retrieval**: AI 只能從 DB 真實 POI 選, 不會編造不存在的景點
- **全台 22 縣市**: 跨北中南東離島
- **資料分層**:
  - 12 個 hand-curated 編輯精選
  - 60+ seed POI (含桃園復興區山林景點)
  - TDX 觀光署爬蟲 pipeline (上線時可灌入 3000+ 親子場館)
- **社群層**: 按讚、評論、上傳景點、積分排行榜 (UI 完成, 後端 Tier B)
- **隱私法遵**: 個資法草案隱私政策 + 兒少資訊保護
- **Rate limit**: Edge Middleware IP-based 3次/天, 防 bot 燒 API 額度
- **Fallback**: API 掛了自動降回規則排序, 永遠不會壞

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript strict
- **AI**: Anthropic Claude Haiku 4.5 (tool use + prompt caching)
- **Hosting**: Vercel
- **Rate Limit**: Vercel Edge Middleware (in-memory; upgrade to Upstash KV for production)
- **DB** (planned Tier B): Supabase Postgres + Auth (LINE/Google OAuth)
- **Monitoring** (planned): Sentry + PostHog

## Quick Start

```bash
pnpm install
cp .env.example .env.local  # 然後填 CHILDTRIP_ANTHROPIC_KEY
pnpm dev
# → http://localhost:3000
```

## Environment Variables

`.env.local` 需要:

```
# AI generation (必須)
CHILDTRIP_ANTHROPIC_KEY=sk-ant-api03-xxxxxxxx

# TDX 觀光署 API (執行 scrape pipeline 才需要)
TDX_APP_ID=your-app-id
TDX_APP_KEY=your-app-key
```

> 為什麼用 `CHILDTRIP_ANTHROPIC_KEY` 而不是 `ANTHROPIC_API_KEY`?
> Claude Code 會在所有 subprocess 注入 `ANTHROPIC_API_KEY` 跟 `ANTHROPIC_BASE_URL`,
> 用獨立的變數名避免被覆蓋.

## Data Pipeline

`scripts/` 內有 3 個 script 可以從 TDX 觀光署灌入全台景點:

```bash
pnpm tdx:scrape   # 抓 raw 資料 (~5 分鐘, 免費)
pnpm tdx:enrich   # Claude 補強親子欄位 (~30-60 分鐘, ~$5-8 USD)
pnpm tdx:build    # 產出 lib/tdx-pois.ts (<5 秒)
# 或: pnpm tdx:all
```

詳見 [scripts/README.md](./scripts/README.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js client)                  │
│  ├─ /              Homepage (POI 探索 + 熱門行程 + 排行)      │
│  ├─ /chat          AI 規劃 4-step wizard                     │
│  ├─ /poi/[id]      POI 詳情                                  │
│  ├─ /itinerary/id  行程詳情                                  │
│  └─ /privacy /terms 法務頁                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/itinerary
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           Edge Middleware (middleware.ts)                    │
│   IP-based rate limit: 3/day · 429 if exceeded              │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│       /api/itinerary (Node runtime, app/api/itinerary/)      │
│  ─────────────────────────────────────────────────           │
│  1. filterCandidates() — 硬條件篩 (age, zone, dest)         │
│  2. Claude Haiku 4.5 — tool use 結構化輸出                    │
│  3. Grounding validator — 每個 poi_id 必須存在               │
│  4. Auto-retry once (tool_result feedback)                   │
│  5. Dedup + return 1-3 distinct plans                        │
└─────────────────────────────────────────────────────────────┘
```

## Roadmap

- [x] v1 內測: 72 hand-curated POI, AI 規劃, 隱私法務頁, rate limit
- [ ] **Tier A 上線**: Vercel deploy + rotate key + GitHub repo
- [ ] **Tier B 完整**: Supabase Auth (LINE / Google) + 儲存行程 + UGC + 積分系統
- [ ] **TDX 灌資料**: 全台 3000+ 親子場館
- [ ] **Tier C 公開**: Sentry + PostHog + Upstash KV + 自有 domain + 律師審條款

## License

MIT

## Acknowledgements

- 交通部觀光署 TDX Platform — 全台觀光景點資料
- 政府開放資料平台 data.gov.tw — 各縣市場館
- Anthropic Claude — AI 規劃引擎
- Next.js / Vercel — 框架與託管
