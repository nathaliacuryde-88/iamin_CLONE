import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PulseStats {
  total_ratings: number;
  fire_count: number;
  mid_count: number;
  flop_count: number;
  avg_score: number | null;
}

export const useEventPulseStats = (eventId: string | undefined) =>
  useQuery({
    queryKey: ["event-pulse-stats", eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<PulseStats> => {
      const { data, error } = await supabase.rpc("get_event_pulse_stats" as any, {
        _event_id: eventId,
      });
      if (error) throw error;
      const row = (data as any[])?.[0];
      return row ?? { total_ratings: 0, fire_count: 0, mid_count: 0, flop_count: 0, avg_score: null };
    },
  });

export const useEventRsvpTimeline = (eventId: string | undefined) =>
  useQuery({
    queryKey: ["event-rsvp-timeline", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_rsvp_timeline" as any, {
        _event_id: eventId,
      });
      if (error) throw error;
      return (data ?? []) as { day: string; confirms: number }[];
    },
  });
