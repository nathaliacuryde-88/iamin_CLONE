import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns true if the current user is the event owner OR is included in any
 * expense (as payer, creator, or share participant) for this event.
 * Used to gate the Group Tab section visibility.
 */
export function useUserHasExpenseAccess(eventId: string | undefined, isOwner: boolean) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["expense-access", eventId, user?.id, isOwner],
    enabled: !!eventId && !!user,
    queryFn: async () => {
      if (isOwner) return true;
      if (!user || !eventId) return false;

      // Check if user created or paid for any expense in this event
      const { data: ownExp } = await supabase
        .from("event_expenses")
        .select("id")
        .eq("event_id", eventId)
        .or(`payer_id.eq.${user.id},created_by.eq.${user.id}`)
        .limit(1);
      if (ownExp && ownExp.length > 0) return true;

      // Check if user is in any expense_share for this event
      const { data: expenses } = await supabase
        .from("event_expenses")
        .select("id")
        .eq("event_id", eventId);
      const ids = (expenses ?? []).map((e) => e.id);
      if (ids.length === 0) return false;

      const { data: shares } = await supabase
        .from("expense_shares")
        .select("id")
        .in("expense_id", ids)
        .eq("user_id", user.id)
        .limit(1);
      return !!shares && shares.length > 0;
    },
  });
}
