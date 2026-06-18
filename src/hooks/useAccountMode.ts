import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AccountMode = "person" | "organizer";

/**
 * Reads the current user's active mode from profiles. Returns "person" while
 * loading so person UI is the safe default.
 */
export const useAccountMode = (): { mode: AccountMode; loading: boolean } => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["account-mode", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [prefRes, profRes] = await Promise.all([
        supabase.from("user_preferences" as any).select("active_mode").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("account_type").eq("user_id", user!.id).maybeSingle(),
      ]);
      return ((prefRes.data as any)?.active_mode ?? (profRes.data as any)?.account_type ?? "person") as AccountMode;
    },
  });
  return { mode: (data ?? "person") as AccountMode, loading: isLoading };
};
