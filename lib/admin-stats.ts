/**
 * Admin dashboard 統計查詢.
 * 全部走 service_role admin client, 因為要看 auth.users.
 */
import { createAdminClient } from "@/lib/supabase/server";

export type AdminStats = {
  users: { total: number; today: number; week: number; month: number };
  recentUsers: Array<{
    id: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    provider: string | null;
  }>;
  content: {
    pois: { approved: number; pending: number };
    itineraries: { total: number; public: number };
    likes: number;
    comments: number;
    bookmarks: number;
  };
  ai: { itinerariesGenerated: number };
};

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();

  // ─── Users (auth.users 是 special schema, 用 admin.auth.admin API) ─────
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersErr) console.error("listUsers error:", usersErr.message);
  const allUsers = usersData?.users ?? [];

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const countAfter = (ts: number) =>
    allUsers.filter((u) => new Date(u.created_at).getTime() >= ts).length;

  // 最近 20 個用戶
  const sortedUsers = [...allUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  // 對應 profiles 拿 display_name + avatar
  const userIds = sortedUsers.map((u) => u.id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      p as { id: string; display_name: string; avatar_url: string | null },
    ])
  );

  const recentUsers = sortedUsers.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      createdAt: u.created_at,
      provider: u.app_metadata?.provider ?? null,
    };
  });

  // ─── Content counts ─────────────────────────────────────────────
  const [
    { count: poisApproved },
    { count: poisPending },
    { count: itinerariesTotal },
    { count: itinerariesPublic },
    { count: likesTotal },
    { count: commentsTotal },
    { count: bookmarksTotal },
  ] = await Promise.all([
    admin.from("pois").select("*", { count: "exact", head: true }).eq("status", "approved"),
    admin
      .from("pois")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("source", "user_upload"),
    admin.from("itineraries").select("*", { count: "exact", head: true }),
    admin
      .from("itineraries")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true),
    admin.from("likes").select("*", { count: "exact", head: true }),
    admin.from("comments").select("*", { count: "exact", head: true }),
    admin.from("bookmarks").select("*", { count: "exact", head: true }),
  ]);

  return {
    users: {
      total: allUsers.length,
      today: countAfter(dayAgo),
      week: countAfter(weekAgo),
      month: countAfter(monthAgo),
    },
    recentUsers,
    content: {
      pois: { approved: poisApproved ?? 0, pending: poisPending ?? 0 },
      itineraries: { total: itinerariesTotal ?? 0, public: itinerariesPublic ?? 0 },
      likes: likesTotal ?? 0,
      comments: commentsTotal ?? 0,
      bookmarks: bookmarksTotal ?? 0,
    },
    ai: {
      // 用 itineraries source='ai' 推估
      itinerariesGenerated: itinerariesTotal ?? 0,
    },
  };
}
