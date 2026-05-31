import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { FeedbackForm } from "./FeedbackForm";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "給我們建議 ・ kidgo" };
export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> 回首頁
        </Link>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          給我們建議
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          看到 bug? 想到新功能? 用得很開心? 直接告訴我們 — 我們會看每一則.
        </p>

        <FeedbackForm
          userEmail={user?.email ?? null}
          isLoggedIn={!!user}
        />
      </main>
    </>
  );
}
