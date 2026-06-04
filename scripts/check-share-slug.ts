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
  const slug = "fsc02urm";

  // 1. 直接查 share_slug
  const { data: bySlug, error: e1 } = await sb
    .from("itineraries")
    .select("id, title, is_public, share_slug, user_id, created_at")
    .eq("share_slug", slug);
  console.log("By slug:", bySlug, e1);

  // 2. 查所有公開行程
  const { data: allPublic } = await sb
    .from("itineraries")
    .select("id, title, is_public, share_slug, user_id, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  console.log("\nAll public itineraries:");
  for (const it of allPublic ?? []) {
    console.log(`  ${it.share_slug ?? "(no slug)"} · ${it.title} · ${it.created_at}`);
  }

  // 3. 查所有有 slug 的行程 (不論公開)
  const { data: allWithSlug } = await sb
    .from("itineraries")
    .select("id, title, is_public, share_slug, user_id, created_at")
    .not("share_slug", "is", null)
    .order("created_at", { ascending: false });
  console.log("\nAll itineraries with slug:");
  for (const it of allWithSlug ?? []) {
    console.log(
      `  ${it.share_slug} · public=${it.is_public} · ${it.title} · ${it.created_at}`
    );
  }

  // 4. 用 join profiles 試試看
  const { data: withJoin, error: e2 } = await sb
    .from("itineraries")
    .select("*, profiles!itineraries_user_id_fkey(display_name, avatar_url)")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  console.log("\nWith profiles join:", withJoin ? "found" : "NOT FOUND", e2);
}

main().catch(console.error);
