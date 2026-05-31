/**
 * /me/bookmarks — 想去清單 (私密)
 * 跟 /me/likes 平行: likes = 公開喜歡, bookmarks = 私密「以後想去」
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bookmark, MapPin, Clock, Wallet } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PoiImage } from "@/components/PoiImage";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { categoryMeta } from "@/lib/mock-data";

export const metadata = { title: "想去清單 ・ kidgo" };
export const dynamic = "force-dynamic";

export default async function MyBookmarksPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login_required=1");

  const admin = createAdminClient();

  const { data: bookmarks } = await admin
    .from("bookmarks")
    .select("target_type, target_id, created_at, note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const poiIds = (bookmarks ?? [])
    .filter((b) => (b as { target_type: string }).target_type === "poi")
    .map((b) => (b as { target_id: string }).target_id);
  const itineraryIds = (bookmarks ?? [])
    .filter((b) => (b as { target_type: string }).target_type === "itinerary")
    .map((b) => (b as { target_id: string }).target_id);

  const [poisResp, itinerariesResp] = await Promise.all([
    poiIds.length > 0
      ? admin
          .from("pois")
          .select("id, name, category, district, city, price_min, price_max, duration_min, photos")
          .in("id", poiIds)
          .eq("status", "approved")
      : Promise.resolve({ data: [] }),
    itineraryIds.length > 0
      ? admin
          .from("itineraries")
          .select("id, title, estimated_cost, days, share_slug, is_public")
          .in("id", itineraryIds)
      : Promise.resolve({ data: [] }),
  ]);

  const pois = poisResp.data ?? [];
  const itineraries = itinerariesResp.data ?? [];
  const totalCount = pois.length + itineraries.length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> 回首頁
        </Link>

        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <Bookmark
              size={28}
              className="fill-amber-400 text-amber-400 sm:size-9"
            />
            想去清單
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            私密 · 只有你看得到 · 共 {totalCount} 個
          </p>
        </div>

        {totalCount === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <Bookmark size={48} className="mx-auto text-stone-300" />
            <h2 className="mt-4 text-lg font-bold">還沒有想去的地方</h2>
            <p className="mt-2 text-sm text-stone-600">
              逛景點時點 🔖 「想去」就會出現在這
            </p>
            <Link
              href="/poi"
              className="mt-4 inline-block rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              逛景點
            </Link>
          </div>
        )}

        {pois.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-bold text-stone-500">
              📍 景點 ({pois.length})
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {pois.map((p) => {
                const row = p as {
                  id: string;
                  name: string;
                  category: string;
                  district: string;
                  city: string | null;
                  price_min: number;
                  price_max: number;
                  duration_min: number;
                  photos: string[] | null;
                };
                const meta = categoryMeta(row.category as Parameters<typeof categoryMeta>[0]);
                const isFree = row.price_min === 0 && row.price_max === 0;
                return (
                  <li key={row.id}>
                    <Link
                      href={`/poi/${row.id}`}
                      className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <PoiImage
                          photo={row.photos?.[0]}
                          gradientClass={meta.gradient}
                          emoji={meta.emoji}
                          alt={row.name}
                          aspect="aspect-square"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold leading-snug">
                          {row.name}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin size={11} /> {row.district}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Clock size={11} /> {Math.round(row.duration_min / 60)}h
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Wallet size={11} />
                            {isFree ? "免費" : `NT$${row.price_min}+`}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {itineraries.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold text-stone-500">
              🗺️ 行程 ({itineraries.length})
            </h2>
            <ul className="space-y-3">
              {itineraries.map((it) => {
                const row = it as {
                  id: string;
                  title: string;
                  estimated_cost: number;
                  days: { days?: { poiIds?: string[] }[] } | null;
                  share_slug: string | null;
                  is_public: boolean;
                };
                const dayCount = row.days?.days?.length ?? 1;
                const href =
                  row.is_public && row.share_slug
                    ? `/i/${row.share_slug}`
                    : `/itinerary/${row.id}`;
                return (
                  <li key={row.id}>
                    <Link
                      href={href}
                      className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <h3 className="font-semibold">{row.title}</h3>
                      <p className="mt-1 text-xs text-stone-500">
                        {dayCount} 天 · 預估 NT${row.estimated_cost?.toLocaleString() ?? 0}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
