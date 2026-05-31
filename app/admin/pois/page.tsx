import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { ModerationCard } from "./ModerationCard";

export const metadata = { title: "POI 審核 ・ kidgo admin" };
export const dynamic = "force-dynamic";

function isAdmin(userId: string): boolean {
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(userId);
}

export default async function AdminPoisPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/pois");
  if (!isAdmin(user.id)) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold">無權限</h1>
          <p className="mt-2 text-sm text-stone-600">
            此頁僅限 admin. 你的 user ID:
          </p>
          <code className="mt-3 inline-block rounded bg-stone-100 px-3 py-1 text-xs">
            {user.id}
          </code>
          <p className="mt-3 text-xs text-stone-500">
            若要成為 admin, 把你的 user ID 加到 Vercel env <code>ADMIN_USER_IDS</code> (逗號分隔多個).
          </p>
        </main>
      </>
    );
  }

  // 用 service_role 列 pending POI (RLS 不會讓一般 user 看到別人的 pending)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: pending } = await admin
    .from("pois")
    .select(
      "id, name, category, district, city, address, age_min, age_max, duration_min, price_min, price_max, description, tags, photos, phone, requires_reservation, contributor_user_id, created_at"
    )
    .eq("status", "pending")
    .eq("source", "user_upload")
    .order("created_at", { ascending: true })
    .limit(50);

  // 同時撈 contributor display_name
  const contributorIds = Array.from(
    new Set((pending ?? []).map((p) => p.contributor_user_id).filter(Boolean))
  ) as string[];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", contributorIds);
  const nameMap = new Map(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      (p as { display_name: string }).display_name,
    ])
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">POI 審核佇列</h1>
        <p className="mt-2 text-sm text-stone-600">
          待審 {pending?.length ?? 0} 個. 按通過 → 立刻全站可見.
        </p>

        {(pending ?? []).length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-4 text-lg font-bold">沒待審的</h2>
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {(pending ?? []).map((p) => (
            <ModerationCard
              key={p.id}
              poi={p}
              contributorName={nameMap.get(p.contributor_user_id) ?? "匿名"}
            />
          ))}
        </ul>
      </main>
    </>
  );
}
