/**
 * Bookmark server queries.
 */
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

type TargetType = "poi" | "itinerary";

export async function isBookmarkedByUser(
  targetType: TargetType,
  targetId: string
): Promise<boolean> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("bookmarks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function getUserBookmarkedSet(
  targetType: TargetType,
  targetIds: string[]
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const admin = createAdminClient();
  const { data } = await admin
    .from("bookmarks")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .in("target_id", targetIds);
  return new Set((data ?? []).map((r) => (r as { target_id: string }).target_id));
}
