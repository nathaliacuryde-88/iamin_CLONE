import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type EventReaction = {
  id: string;
  event_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

/** Fetch all reactions for one event. */
export const useEventReactions = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-reactions", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_reactions" as any)
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return (data ?? []) as unknown as EventReaction[];
    },
  });
};

/** Toggle a single emoji reaction for the current user. */
export const useToggleReaction = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, emoji }: { eventId: string; emoji: string }) => {
      if (!user) throw new Error("Not signed in");
      // Check existing
      const { data: existing } = await supabase
        .from("event_reactions" as any)
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("event_reactions" as any)
          .delete()
          .eq("id", (existing as any).id);
        if (error) throw error;
        return { added: false };
      }
      const { error } = await supabase
        .from("event_reactions" as any)
        .insert({ event_id: eventId, user_id: user.id, emoji });
      if (error) throw error;
      return { added: true };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["event-reactions", vars.eventId] });
    },
  });
};
