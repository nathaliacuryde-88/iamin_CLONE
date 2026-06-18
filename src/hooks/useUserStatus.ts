import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserStatus = "available" | "not_tonight" | "low_energy";

export type ActiveStatus = {
  user_id: string;
  status: UserStatus;
  expires_at: string | null;
} | null;

const isActive = (row: any): boolean =>
  !!row && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now());

export function useMyStatus() {
  const { user } = useAuth();
  return useQuery<ActiveStatus>({
    queryKey: ["user-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_statuses" as any)
        .select("user_id, status, expires_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      // Travelling is no longer offered — treat as cleared.
      if (data && (data as any).status === "travelling") return null;
      return isActive(data) ? (data as any) : null;
    },
  });
}

export function useSetStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: UserStatus | null) => {
      if (!user) throw new Error("Not signed in");
      if (status === null) {
        await supabase.from("user_statuses" as any).delete().eq("user_id", user.id);
        return null;
      }
      // not_tonight clears after 24h; low_energy stays a week.
      const expires_at =
        status === "not_tonight"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : status === "low_energy"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null;
      await supabase
        .from("user_statuses" as any)
        .upsert({ user_id: user.id, status, expires_at }, { onConflict: "user_id" });
      return { user_id: user.id, status, expires_at };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-status"] });
      qc.invalidateQueries({ queryKey: ["friend-statuses"] });
    },
  });
}
