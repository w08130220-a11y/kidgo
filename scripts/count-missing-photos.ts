import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { count: total } = await sb
    .from("pois")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  // 沒照片的: photos IS NULL OR photos = {}
  const { count: noPhoto } = await sb
    .from("pois")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .or("photos.is.null,photos.eq.{}");

  console.log(`總共 approved POI: ${total}`);
  console.log(`沒照片的: ${noPhoto}`);
  console.log(`覆蓋率: ${(((total! - noPhoto!) / total!) * 100).toFixed(1)}%`);

  // by source 看是哪一類沒圖
  const { data: sample } = await sb
    .from("pois")
    .select("source")
    .eq("status", "approved")
    .or("photos.is.null,photos.eq.{}")
    .limit(2000);

  const bySource: Record<string, number> = {};
  for (const r of sample ?? []) {
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  }
  console.log("\n沒照片的 by source:");
  for (const [s, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s.padEnd(15)} ${n.toString().padStart(5)}`);
  }

  // 各 city 的沒照片數
  const { data: cityData } = await sb
    .from("pois")
    .select("city")
    .eq("status", "approved")
    .or("photos.is.null,photos.eq.{}")
    .limit(5000);

  const byCity: Record<string, number> = {};
  for (const r of cityData ?? []) {
    byCity[r.city ?? "unknown"] = (byCity[r.city ?? "unknown"] ?? 0) + 1;
  }
  console.log("\n沒照片的 by city (top 10):");
  for (const [c, n] of Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)) {
    console.log(`  ${c.padEnd(10)} ${n.toString().padStart(5)}`);
  }

  // 隨機 sample 10 個沒照片的看名字
  const { data: samples } = await sb
    .from("pois")
    .select("name, city, district, source")
    .eq("status", "approved")
    .or("photos.is.null,photos.eq.{}")
    .limit(15);
  console.log("\n沒照片的隨機樣本:");
  for (const p of samples ?? []) {
    console.log(`  [${p.source}] ${p.city ?? ""} ${p.district ?? ""}: ${p.name}`);
  }
}

main().catch(console.error);
