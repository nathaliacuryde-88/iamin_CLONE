import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserStatus } from "./useUserStatus";

export type StatusMap = Record<string, { status: UserStatus; expires_at: string | null }>;

/**
 * Loads active statuses for the given user ids (mutual friends only —
 * RLS handles filtering). Expired rows are dropped client-side.
 */
export function useFriendStatuses(userIds: string[]) {
  const { user } = useAuth();
  const ids = [...new Set(userIds.filter(Boolean))].sort();
  return useQuery<StatusMap>({
    queryKey: ["friend-statuses", user?.id, ids.join(",")],
    enabled: !!user && ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_statuses" as any)
        .select("user_id, status, expires_at")
        .in("user_id", ids);
      const now = Date.now();
      const map: StatusMap = {};
      for (const row of (data ?? []) as any[]) {
        if (!row.expires_at || new Date(row.expires_at).getTime() > now) {
          map[row.user_id] = { status: row.status, expires_at: row.expires_at };
        }
      }
      return map;
    },
    staleTime: 60_000,
  });
}
