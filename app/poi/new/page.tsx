import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";
import { NewPoiForm } from "./NewPoiForm";

export const metadata = { title: "新增景點 ・ kidgo" };
export const dynamic = "force-dynamic";

export default async function NewPoiPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/poi/new");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">新增親子景點</h1>
        <p className="mt-2 text-sm text-stone-600">
          幫其他爸媽補上系統還沒有的好地方. 送出後會進入審核, 通過後全站可見.
        </p>
        <NewPoiForm userId={user.id} />
      </main>
    </>
  );
}
