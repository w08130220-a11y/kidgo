import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Compass, Plus, Clock, Check, X } from "lucide-react";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "我上傳的景點 ・ kidgo" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "審核中", cls: "bg-amber-100 text-amber-700", icon: <Clock size={12} /> },
  approved: { label: "已上架", cls: "bg-emerald-100 text-emerald-700", icon: <Check size={12} /> },
  rejected: { label: "未通過", cls: "bg-rose-100 text-rose-700", icon: <X size={12} /> },
  archived: { label: "已下架", cls: "bg-stone-100 text-stone-600", icon: <X size={12} /> },
};

export default async function MyUploadsPage({
  searchParams,
}: {
  searchParams: Promise<{ just_submitted?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login_required=1");

  const { data: pois, error } = await supabase
    .from("pois")
    .select("id, name, category, district, city, status, created_at, photos, view_count, like_count")
    .eq("contributor_user_id", user.id)
    .order("created_at", { ascending: false });

  const counts = (pois ?? []).reduce<Record<string, number>>(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    {}
  );

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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">我上傳的景點</h1>
          <p className="mt-2 text-sm text-stone-600">
            共 {pois?.length ?? 0} 個
            {counts.pending ? ` · ${counts.pending} 個審核中` : ""}
            {counts.approved ? ` · ${counts.approved} 個已上架` : ""}
          </p>
          <Link
            href="/poi/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={16} /> 新增景點
          </Link>
        </div>

        {sp.just_submitted && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <Check size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">送出成功!</p>
              <p className="mt-0.5 text-xs">通常 1-2 天內會審核完, 通過後全站可見.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            載入失敗: {error.message}
          </div>
        )}

        {!error && pois?.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
            <div className="text-5xl">📍</div>
            <h2 className="mt-4 text-lg font-bold">還沒上傳任何景點</h2>
            <p className="mt-2 text-sm text-stone-600">
              知道哪裡好玩? 幫其他爸媽補上!
            </p>
            <Link
              href="/poi/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Plus size={14} /> 上傳第一個
            </Link>
          </div>
        )}

        {!error && pois && pois.length > 0 && (
          <ul className="space-y-3">
            {pois.map((p) => {
              const meta = STATUS_META[p.status] ?? STATUS_META.pending;
              return (
                <li
                  key={p.id}
                  className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {p.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photos[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl text-stone-400">
                        📍
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold">{p.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {p.city ?? ""} {p.district} · {p.category} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("zh-TW")}
                    </p>
                    {p.status === "approved" && (
                      <p className="mt-1 text-xs text-stone-500">
                        👀 {p.view_count} · ❤ {p.like_count}
                      </p>
                    )}
                  </div>
                  {p.status === "approved" && (
                    <Link
                      href={`/poi/${p.id}`}
                      className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      開啟
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10 rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Compass size={14} /> 上傳小撇步
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone-600">
            <li>名稱用「親子怎麼搜的」, 不要寫官方全名</li>
            <li>描述講「為什麼適合帶小孩」, 不要 copy 維基</li>
            <li>有照片通過率大概是沒照片的 3 倍</li>
            <li>地址越精確越好, 附近交通有提到加分</li>
          </ul>
        </div>
      </main>
    </>
  );
}
