import { useQuery, useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast, endOfDay } from "date-fns";

export type OrganizerDNAEvent = {
  id: string;
  name: string;
  date: string | null;
  vibe_category: string | null;
};

export type OrganizerDNA = {
  hasEnoughData: boolean;
  totals: {
    events: number;
    attendees: number;
    avgRating: number | null;
    polls: number;
  };
  signature: {
    topVibe: { vibe: string; avg: number } | null;
    bestDay: { day: string; avg: number } | null;
  };
};

/**
 * Venue / organizer DNA — track record + signature vibe for a given organizer user_id.
 * Public-safe: reads only public events + their pulse aggregates.
 */
export const useOrganizerDNA = (organizerUserId: string | undefined) => {
  const eventsQ = useQuery({
    queryKey: ["organizer-dna-events", organizerUserId],
    enabled: !!organizerUserId,
    queryFn: async (): Promise<(OrganizerDNAEvent & { going: number })[]> => {
      const { data: events } = await supabase
        .from("events")
        .select("id,name,date,vibe_category")
        .eq("created_by", organizerUserId!)
        .order("date", { ascending: false });
      const list = (events ?? []).filter(
        (e) => e.date && isPast(endOfDay(parseISO(e.date))),
      );
      const ids = list.map((e) => e.id);
      const { data: atts } = ids.length
        ? await supabase.from("attendees").select("event_id,status").in("event_id", ids)
        : { data: [] };
      return list.map((e: any) => ({
        ...e,
        going: (atts ?? []).filter((a: any) => a.event_id === e.id && a.status === "going").length,
      }));
    },
  });

  const past = eventsQ.data ?? [];

  const statsQueries = useQueries({
    queries: past.map((e) => ({
      queryKey: ["event-pulse-stats", e.id],
      queryFn: async () => {
        const { data } = await supabase.rpc("get_event_pulse_stats" as any, { _event_id: e.id });
        return (data as any[])?.[0] ?? null;
      },
    })),
  });

  const isLoading = eventsQ.isLoading || statsQueries.some((q) => q.isLoading);

  const dna: OrganizerDNA = (() => {
    const totalsBase = {
      events: past.length,
      attendees: past.reduce((sum, e) => sum + e.going, 0),
      avgRating: null as number | null,
      polls: 0,
    };
    const scores: number[] = [];
    statsQueries.forEach((q) => {
      const r = q.data as any;
      if (r?.avg_score != null) scores.push(Number(r.avg_score));
      totalsBase.polls += r?.total_ratings ?? 0;
    });
    totalsBase.avgRating = scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : null;

    // Signature vibe + best day
    const byVibe: Record<string, number[]> = {};
    const byDow: Record<string, number[]> = {};
    past.forEach((e, i) => {
      const score = (statsQueries[i].data as any)?.avg_score;
      if (score == null) return;
      const v = e.vibe_category?.trim();
      if (v) (byVibe[v] ??= []).push(Number(score));
      if (e.date) {
        const dow = format(parseISO(e.date), "EEEE");
        (byDow[dow] ??= []).push(Number(score));
      }
    });
    const topVibe = Object.entries(byVibe)
      .map(([vibe, arr]) => ({ vibe, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg)[0] ?? null;
    const bestDay = Object.entries(byDow)
      .map(([day, arr]) => ({ day, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg)[0] ?? null;

    return {
      hasEnoughData: past.length > 0,
      totals: totalsBase,
      signature: { topVibe, bestDay },
    };
  })();

  return { dna, isLoading };
};
