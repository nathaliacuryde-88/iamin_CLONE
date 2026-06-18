import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type EventRating = "fire" | "mid" | "flop";

export interface EventScoreSummary {
  event_id: string;
  total_ratings: number;
  fire_count: number;
  mid_count: number;
  flop_count: number;
  fire_pct: number | null;
}

export interface CreatorScore {
  user_id: string;
  events_rated: number;
  total_ratings: number;
  fire_count: number;
  fire_pct: number | null;
}

/** My rating for a given event (or null). */
export const useMyEventRating = (eventId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-event-rating", eventId, user?.id],
    enabled: !!eventId && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_ratings")
        .select("rating")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data?.rating as EventRating) ?? null;
    },
  });
};

/** Public aggregate score for an event. */
export const useEventScore = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-score", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_score_summary" as any)
        .select("*")
        .eq("event_id", eventId!)
        .maybeSingle();
      return (data as unknown as EventScoreSummary) ?? null;
    },
  });
};

/** Public track-record for a creator. */
export const useCreatorScore = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["creator-score", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_scores" as any)
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      return (data as unknown as CreatorScore) ?? null;
    },
  });
};

/** Submit / change my rating. */
export const useSubmitRating = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      rating,
    }: {
      eventId: string;
      rating: EventRating;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("event_ratings")
        .upsert(
          { event_id: eventId, user_id: user.id, rating },
          { onConflict: "event_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["my-event-rating", vars.eventId] });
      qc.invalidateQueries({ queryKey: ["event-score", vars.eventId] });
      qc.invalidateQueries({ queryKey: ["creator-score"] });
      qc.invalidateQueries({ queryKey: ["pending-exit-polls"] });
    },
  });
};

/**
 * Past events the current user RSVP'd "going" to and hasn't yet rated.
 * Used by the auto-prompt sheet.
 */
export const usePendingExitPolls = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending-exit-polls", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: going } = await supabase
        .from("attendees")
        .select("event_id")
        .eq("user_id", user!.id)
        .eq("status", "going");
      const ids = (going ?? []).map((a) => a.event_id);
      if (ids.length === 0) return [];

      // Past events only (date already happened, within last 14 days so
      // we don't nag forever).
      const today = new Date();
      const cutoff = new Date(today.getTime() - 14 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      const todayStr = today.toISOString().slice(0, 10);

      const { data: events } = await supabase
        .from("events")
        .select("id, name, date, image_url, description, created_by")
        .in("id", ids)
        .lt("date", todayStr)
        .gte("date", cutoff)
        .order("date", { ascending: false });

      // Exclude events the user organized themselves — no self-vibe-check.
      const others = (events ?? []).filter((e) => e.created_by !== user!.id);
      const evIds = others.map((e) => e.id);
      if (evIds.length === 0) return [];

      const { data: rated } = await supabase
        .from("event_ratings")
        .select("event_id")
        .eq("user_id", user!.id)
        .in("event_id", evIds);
      const ratedSet = new Set((rated ?? []).map((r) => r.event_id));
      return others.filter((e) => !ratedSet.has(e.id));
    },
  });
};
