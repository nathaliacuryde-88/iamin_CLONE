import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RecommendedPerson {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  mutuals: number;
  sameCity: boolean;
  isNew: boolean;
  score: number;
}

/**
 * Early-stage friend discovery — ranks profiles you don't already follow by:
 * mutual-friend overlap (heaviest), same city, and recency.
 * Server-side filtering is intentionally light; we lean on the rather small
 * user base in the early app phase to make this cheap.
 */
export function useRecommendedPeople(limit = 20) {
  const { user } = useAuth();
  return useQuery<RecommendedPerson[]>({
    queryKey: ["recommended-people", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const [{ data: meProfile }, { data: myFollowing }] = await Promise.all([
        supabase.from("profiles").select("city").eq("user_id", user.id).maybeSingle(),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);
      const myCity = meProfile?.city?.trim().toLowerCase() ?? null;
      const followingIds = new Set((myFollowing ?? []).map((r: any) => r.following_id));
      followingIds.add(user.id);

      // Pull a recent slice of public profiles — enough to score 100-ish people.
      const { data: candidates } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, city, created_at, account_type")
        .order("created_at", { ascending: false })
        .limit(150);

      const filtered = (candidates ?? [])
        .filter((p: any) => !followingIds.has(p.user_id));
      if (filtered.length === 0) return [];

      // Compute mutual-friend counts for the candidate set.
      const candidateIds = filtered.map((p: any) => p.user_id);
      const { data: theirFollows } = await supabase
        .from("follows")
        .select("follower_id, following_id")
        .in("follower_id", candidateIds);
      const mutualsByCandidate = new Map<string, number>();
      for (const row of (theirFollows ?? []) as any[]) {
        if (followingIds.has(row.following_id)) {
          mutualsByCandidate.set(row.follower_id, (mutualsByCandidate.get(row.follower_id) ?? 0) + 1);
        }
      }

      const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const scored: RecommendedPerson[] = filtered.map((p: any) => {
        const mutuals = mutualsByCandidate.get(p.user_id) ?? 0;
        const sameCity = !!myCity && p.city?.trim().toLowerCase() === myCity;
        const isNew = p.created_at ? now - new Date(p.created_at).getTime() < NEW_WINDOW_MS : false;
        const score = mutuals * 10 + (sameCity ? 3 : 0) + (isNew ? 2 : 0);
        return {
          user_id: p.user_id,
          display_name: p.display_name ?? null,
          username: p.username ?? null,
          avatar_url: p.avatar_url ?? null,
          city: p.city ?? null,
          mutuals,
          sameCity,
          isNew,
          score,
        };
      });

      scored.sort((a, b) => b.score - a.score || (a.display_name ?? "").localeCompare(b.display_name ?? ""));
      return scored.slice(0, limit);
    },
    staleTime: 5 * 60_000,
  });
}
