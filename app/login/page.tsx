import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { createServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "登入 ・ kidgo",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; login_error?: string }>;
}) {
  const { next = "/", login_error } = await searchParams;

  // 已登入直接 redirect 不停留在登入頁
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-20">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> 回首頁
        </Link>
        <LoginForm nextPath={next} initialError={login_error} />
      </main>
    </>
  );
}
