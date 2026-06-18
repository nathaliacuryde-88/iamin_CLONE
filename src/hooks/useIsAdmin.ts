import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns true when the current user has the `admin` role in user_roles.
 * Used to gate dev-only affordances (e.g. the Person/Organizer mode toggle).
 */
export const useIsAdmin = (): { isAdmin: boolean; loading: boolean } => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
  return { isAdmin: !!data, loading: isLoading };
};
