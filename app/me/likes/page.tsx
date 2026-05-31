/**
 * /me/likes — 我按過讚的景點 + 行程
 * 用 likes table 直接 query, 不需要新 schema
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart, MapPin, Clock, Wallet } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PoiImage } from "@/components/PoiImage";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { categoryMeta } from "@/lib/mock-data";

export const metadata = { title: "我按過讚的 ・ kidgo" };
export const dynamic = "force-dynamic";

export default async function MyLikesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login_required=1");

  const admin = createAdminClient();

  // 撈用戶按讚的 POI + Itinerary
  const { data: likes } = await admin
    .from("likes")
    .select("target_type, target_id, created_at")
    .eq("user_id", user.id)
    .in("target_type", ["poi", "itinerary"])
    .order("created_at", { ascending: false })
    .limit(200);

  const poiIds = (likes ?? [])
    .filter((l) => (l as { target_type: string }).target_type === "poi")
    .map((l) => (l as { target_id: string }).target_id);
  const itineraryIds = (likes ?? [])
    .filter((l) => (l as { target_type: string }).target_type === "itinerary")
    .map((l) => (l as { target_id: string }).target_id);

  // 抓兩種 target 的詳細資料
  const [poisResp, itinerariesResp] = await Promise.all([
    poiIds.length > 0
      ? admin
          .from("pois")
          .select("id, name, category, district, city, price_min, price_max, duration_min, photos, like_count")
          .in("id", poiIds)
          .eq("status", "approved")
      : Promise.resolve({ data: [] }),
    itineraryIds.length > 0
      ? admin
          .from("itineraries")
          .select("id, title, estimated_cost, days, like_count, share_slug, is_public")
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            我按過讚的
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            共 {totalCount} 個 · 景點 {pois.length} · 行程 {itineraries.length}
          </p>
        </div>

        {totalCount === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <Heart size={48} className="mx-auto text-stone-300" />
            <h2 className="mt-4 text-lg font-bold">還沒按過讚</h2>
            <p className="mt-2 text-sm text-stone-600">
              在景點或行程上點 ❤ 就會出現在這裡
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
                  like_count: number;
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
                        <p className="mt-1 text-xs text-rose-500">
                          ❤ {row.like_count.toLocaleString()}
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
                  like_count: number;
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
                        {" · ❤ "}
                        {row.like_count}
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
