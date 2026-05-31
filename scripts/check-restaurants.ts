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
  const { data: byCat } = await sb
    .from("pois")
    .select("category")
    .eq("status", "approved");

  const counts: Record<string, number> = {};
  for (const r of byCat ?? []) counts[r.category] = (counts[r.category] ?? 0) + 1;
  console.log("By category:");
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${v.toLocaleString()}`);
  }

  const { data: topRest } = await sb
    .from("pois")
    .select("name, city, like_count")
    .eq("category", "restaurant")
    .eq("status", "approved")
    .order("like_count", { ascending: false })
    .limit(10);
  console.log("\nTop 10 restaurants by likes:");
  for (const r of topRest ?? []) {
    console.log(`  ${(r.like_count ?? 0).toString().padStart(5)} ${r.name} (${r.city})`);
  }

  const { data: byCity } = await sb
    .from("pois")
    .select("city")
    .eq("category", "restaurant")
    .eq("status", "approved");
  const cityCount: Record<string, number> = {};
  for (const r of byCity ?? []) cityCount[r.city ?? "unknown"] = (cityCount[r.city ?? "unknown"] ?? 0) + 1;
  console.log("\nRestaurants by city:");
  for (const [k, v] of Object.entries(cityCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(8)} ${v}`);
  }
}

main().catch(console.error);
