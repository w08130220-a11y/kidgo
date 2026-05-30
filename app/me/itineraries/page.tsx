import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Bookmark, Calendar, Eye, Heart, Trash2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";

// Server Action for delete (執行在 server 端, RLS 自動套用)
async function deleteItineraryAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("itineraries").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/me/itineraries");
}

export const metadata = {
  title: "我的行程 ・ kidgo",
};

export const dynamic = "force-dynamic";

export default async function MyItinerariesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login_required=1");
  }

  const { data: itineraries, error } = await supabase
    .from("itineraries")
    .select("id, title, days, estimated_cost, is_public, like_count, view_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">我的行程</h1>
            <p className="mt-2 text-sm text-stone-600">
              你儲存的所有行程 · 共 {itineraries?.length ?? 0} 個
            </p>
          </div>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + 規劃新行程
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            載入失敗: {error.message}
          </div>
        )}

        {!error && itineraries?.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <div className="text-5xl">📋</div>
            <h2 className="mt-4 text-lg font-bold">還沒儲存任何行程</h2>
            <p className="mt-2 text-sm text-stone-600">
              到 AI 規劃 → 跑出方案 → 點「儲存」就會出現在這
            </p>
            <Link
              href="/chat"
              className="mt-4 inline-block rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              開始第一個行程
            </Link>
          </div>
        )}

        {!error && itineraries && itineraries.length > 0 && (
          <ul className="space-y-3">
            {itineraries.map((it) => (
              <li
                key={it.id}
                className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-200 to-amber-300 text-2xl">
                  <Bookmark size={22} className="text-orange-800" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold">{it.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} /> {new Date(it.created_at).toLocaleDateString("zh-TW")}
                    </span>
                    {it.estimated_cost > 0 && (
                      <span>預估 NT${it.estimated_cost.toLocaleString()}</span>
                    )}
                    {it.is_public && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">
                        公開
                      </span>
                    )}
                    {(it.like_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Heart size={11} className="fill-rose-400 text-rose-400" />
                        {it.like_count}
                      </span>
                    )}
                    {(it.view_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Eye size={11} /> {it.view_count}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/itinerary/${it.id}`}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                  >
                    開啟
                  </Link>
                  <form action={deleteItineraryAction} className="inline">
                    <input type="hidden" name="id" value={it.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                      title="刪除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
