import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Friends = mutual follows (you follow them AND they follow you).
 * Used for duplicate-event detection.
 */
export const useFriendIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friend-ids", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const [{ data: out }, { data: incoming }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
        supabase.from("follows").select("follower_id").eq("following_id", user.id),
      ]);
      const outSet = new Set(out?.map((r) => r.following_id) ?? []);
      const incSet = new Set(incoming?.map((r) => r.follower_id) ?? []);
      return [...outSet].filter((id) => incSet.has(id));
    },
    enabled: !!user,
  });
};
