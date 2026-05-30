# Data Ingestion Pipeline

從 TDX 觀光署 API 抓全台 5000+ 景點/餐廳，用 Claude 補強成親子友善資料庫。

## 使用流程

### 一次性設定

1. 註冊 TDX (5 分鐘): https://tdx.transportdata.tw/register
2. 創 application → 拿到 `app_id` 跟 `app_key`
3. 加到 `.env.local`:
   ```
   TDX_APP_ID=your-app-id
   TDX_APP_KEY=your-app-key
   CHILDTRIP_ANTHROPIC_KEY=sk-ant-...
   ```

### 跑完整 pipeline

```bash
pnpm tdx:all
```

= 等於依序跑：

```bash
pnpm tdx:scrape   # Step 1: 抓 raw TDX 資料 → data/tdx-raw.json
pnpm tdx:enrich   # Step 2: Claude 補強親子欄位 → data/pois-enriched.json
pnpm tdx:build    # Step 3: 產出 lib/tdx-pois.ts (合進 mock-data.ts)
```

### 個別 script 說明

#### `scrape-tdx.ts` — 抓 raw 資料
- 從 22 縣市抓 ScenicSpot + Restaurant
- 約 5,000-8,000 筆原始 POI
- 寫到 `data/tdx-raw.json`
- 耗時: ~5 分鐘 (API throttle)
- 成本: $0 (TDX 免費)
- Idempotent: 已有檔案跳過 (除非 `--force`)

#### `enrich-pois.ts` — Claude 補強
- 讀 raw 資料, 每筆送 Claude Haiku 4.5
- 輸出: { ageMin, ageMax, parentingTags, kidScore, durationMin, priceMin/Max }
- 用 prompt caching (system prompt 共用), 省 ~85% input tokens
- 寫到 `data/pois-enriched.json` (每 10 筆 flush, 支援中斷續跑)
- 耗時: ~30-60 分鐘 (5000 筆)
- 成本: 約 $5-8 USD
- 自動跳過 kidScore < 5 的非親子場館

#### `build-tdx-pois.ts` — 產出 TS 模組
- 讀 enriched 資料, 過濾 kidScore >= 5
- 寫到 `lib/tdx-pois.ts` (TypeScript module)
- `mock-data.ts` 會自動 merge 進現有 POI 池
- 耗時: <5 秒
- 成本: $0

## 重新跑

- 抓最新景點 (TDX 每月更新): `pnpm tdx:scrape --force && pnpm tdx:enrich && pnpm tdx:build`
- 只重補強 (調 prompt 時): `pnpm tdx:enrich --force && pnpm tdx:build`
- 只重 build (調 filter rule): `pnpm tdx:build`

## 預期結果

| 階段 | 輸出檔案 | 大小 | 內容 |
|------|---------|------|------|
| scrape | `data/tdx-raw.json` | ~10 MB | 5000-8000 筆 raw POI |
| enrich | `data/pois-enriched.json` | ~5 MB | 全部加上 AI 親子欄位 |
| build | `lib/tdx-pois.ts` | ~2 MB | 過濾後 ~3000 筆親子場館 |

## 給未來的我

- TDX V3 API 有更豐富欄位 (照片、評論)，下次改 endpoint 換 V3
- Tier B 上 Supabase 後，`build-tdx-pois` 改成 upsert 到 DB
- Embedding 等 POI > 1000 再做 (用 OpenAI text-embedding-3-small)
- Google Places 補強 v1.5 再做 (要錢)
