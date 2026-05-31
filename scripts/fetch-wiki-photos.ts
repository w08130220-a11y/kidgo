/**
 * 用 Wikipedia API 給所有沒照片的 seed POI 抓主圖.
 * Wikipedia REST API: https://zh.wikipedia.org/api/rest_v1/page/summary/{title}
 * Returns: { originalimage: {source}, thumbnail: {source} } or 404
 *
 * 策略:
 *   1. 試完整 POI 名稱
 *   2. 不行就去掉 (...括號) + 「+」分隔的後半 + 「－」-「副標」
 *   3. 還不行就 fallback 到 name 前 2-3 個關鍵詞
 *   4. 都不行 → skip (繼續用漸層)
 *
 * 用法: pnpm tsx scripts/fetch-wiki-photos.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// 已知 stubborn POI 直接對到正確 Wikipedia 頁名
const MANUAL_OVERRIDES: Record<string, string[]> = {
  "臺北市兒童新樂園": ["兒童新樂園"],
  "公館 自來水園區": ["臺北自來水園區", "自來水博物館"],
  "林口三井 OUTLET 樂高樂園探索中心": ["三井OUTLET PARK 林口", "樂高樂園探索中心"],
  "拉拉山神木區": ["拉拉山"],
  "桃源仙谷": ["桃源仙谷"],
  "新竹市玻璃工藝博物館": ["新竹市立玻璃工藝博物館"],
  "大坑九號步道 + 紙箱王": ["大坑風景區", "紙箱王主題餐廳"],
  "清境綿羊牧場": ["清境農場"],
  "溪頭妖怪村 + 自然教育園區": ["妖怪村", "溪頭自然教育園區"],
  "樹谷生活科學館": ["樹谷園區", "樹谷生活科學館"],
  "蓮池潭龍虎塔 + 春秋閣": ["蓮池潭", "龍虎塔"],
  "鹿野高台 (熱氣球嘉年華)": ["鹿野高台", "臺灣國際熱氣球嘉年華"],
  "金門古寧頭戰史館 + 鸕鶿季": ["古寧頭戰史館", "古寧頭戰役"],
  "馬祖藍眼淚 (季節限定)": ["藍眼淚", "馬祖列島"],
  "北投親子館 + 玩具圖書館": ["北投區"],  // fallback to 北投區
};

// 把名稱簡化成可能的 Wikipedia 頁名
function expandQueries(name: string): string[] {
  const queries: string[] = [];
  queries.push(name); // 原始

  // 去掉括號內容
  const noParens = name.replace(/\([^)]*\)/g, "").replace(/[（].*?[）]/g, "").trim();
  if (noParens && noParens !== name) queries.push(noParens);

  // 「+」、「－」、「-」、「、」、「・」 拆 → 雙向都試
  const splitChars = /[+＋－\-、・]/;
  if (splitChars.test(noParens)) {
    const parts = noParens.split(splitChars).map((s) => s.trim()).filter(Boolean);
    queries.push(...parts);
  }

  // 用空格分割取前 1-2 個關鍵詞
  const tokens = noParens.replace(splitChars, " ").split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    queries.push(tokens[0]);
    queries.push(tokens.slice(0, 2).join(""));
  }

  // 簡繁/台臺對換
  const variants: string[] = [];
  for (const q of queries) {
    if (q.includes("臺")) variants.push(q.replace(/臺/g, "台"));
    if (q.includes("台")) variants.push(q.replace(/台/g, "臺"));
  }
  queries.push(...variants);

  // 特殊規則: 去除常見後綴詞讓查詢更通用
  const stripSuffixes = ["主題樂園", "親子餐廳", "親子料理", "公園", "區", "店", "中心", "館", "農場", "牧場", "森林遊樂區", "國家森林遊樂區", "風景區", "戰史館", "兒童學藝中心"];
  for (const q of queries.slice(0, 3)) {
    for (const suffix of stripSuffixes) {
      if (q.endsWith(suffix) && q.length > suffix.length + 1) {
        queries.push(q.slice(0, -suffix.length));
      }
    }
  }

  // Manual overrides 優先排前面
  if (MANUAL_OVERRIDES[name]) {
    queries.unshift(...MANUAL_OVERRIDES[name]);
  }

  // 去重 + 過濾太短的
  return [...new Set(queries.filter((q) => q && q.length >= 2))];
}

async function fetchWikiImage(title: string): Promise<string | null> {
  const url = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "kidgo/1.0 (https://kidgo-three.vercel.app)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      originalimage?: { source: string };
      thumbnail?: { source: string };
    };
    // 偏好原圖, 否則 thumbnail (640px 中等大小)
    if (data.originalimage?.source) {
      // 但 originalimage 可能很大 (10MB+), 用 thumbnail 控制成 640px
      const orig = data.originalimage.source;
      // Wikipedia thumb URL pattern: insert /thumb/ + /640px-{filename}
      // e.g.  .../commons/a/b/X.jpg → .../commons/thumb/a/b/X.jpg/640px-X.jpg
      const m = orig.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z]+)\/([a-z0-9])\/([a-z0-9]{2})\/(.+)$/i);
      if (m) {
        return `${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/640px-${m[4]}`;
      }
      return orig;
    }
    if (data.thumbnail?.source) return data.thumbnail.source;
    return null;
  } catch {
    return null;
  }
}

async function tryGetImage(name: string): Promise<{ url: string | null; tried: string[] }> {
  const tried: string[] = [];
  for (const q of expandQueries(name)) {
    tried.push(q);
    const url = await fetchWikiImage(q);
    if (url) return { url, tried };
    // 禮貌一下, 別連發
    await new Promise((r) => setTimeout(r, 200));
  }
  return { url: null, tried };
}

async function main() {
  // 抓所有 hand/seed POI 沒照片的
  const { data: needPhotos } = await sb
    .from("pois")
    .select("id, name")
    .neq("source", "tdx")
    .or("photos.is.null,photos.eq.{}");

  console.log(`找到 ${needPhotos?.length ?? 0} 個 seed POI 沒照片\n`);

  let found = 0;
  let notFound = 0;
  for (const p of needPhotos ?? []) {
    const { url, tried } = await tryGetImage(p.name);
    if (url) {
      const { error } = await sb.from("pois").update({ photos: [url] }).eq("id", p.id);
      if (error) {
        console.log(`  ❌ ${p.name} → update DB 失敗:`, error.message);
      } else {
        found++;
        console.log(`  📷 ${p.name} (試了 ${tried.length} 種變化)`);
      }
    } else {
      notFound++;
      console.log(`  ❌ ${p.name} (試了 ${tried.length} 種變化, Wikipedia 都沒)`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n✅ 找到 ${found} 個, 找不到 ${notFound} 個`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
