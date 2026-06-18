import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { LineStatus } from "@/hooks/useLineMode";

export interface LineVote {
  id: string;
  event_id: string;
  user_id: string;
  status: LineStatus;
  created_at: string;
  updated_at: string;
}

const ACTIVE_WINDOW_MS = 30 * 60 * 1000;

/**
 * Attendee-driven line status: every attendee can post a vote with the
 * current door situation. Derived status = most-voted in the last 30 min,
 * tie-broken by recency.
 */
export function useLineVotes(eventId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ["line-votes", eventId];

  const query = useQuery({
    queryKey: key,
    enabled: !!eventId,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_line_votes" as any)
        .select("*")
        .eq("event_id", eventId!)
        .order("updated_at", { ascending: false });
      return (data ?? []) as any as LineVote[];
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!eventId) return;
    const ch = supabase
      .channel(`line-votes-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_line_votes", filter: `event_id=eq.${eventId}` },
        () => queryClient.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const votes = query.data ?? [];
  const derived = useMemo(() => {
    const cutoff = Date.now() - ACTIVE_WINDOW_MS;
    const active = votes.filter((v) => new Date(v.updated_at).getTime() > cutoff);
    if (active.length === 0) return null;
    const counts = new Map<LineStatus, { count: number; mostRecent: string }>();
    for (const v of active) {
      const cur = counts.get(v.status);
      if (!cur) counts.set(v.status, { count: 1, mostRecent: v.updated_at });
      else {
        cur.count += 1;
        if (v.updated_at > cur.mostRecent) cur.mostRecent = v.updated_at;
      }
    }
    let best: { status: LineStatus; count: number; mostRecent: string } | null = null;
    counts.forEach((v, status) => {
      if (!best || v.count > best.count || (v.count === best.count && v.mostRecent > best.mostRecent)) {
        best = { status, count: v.count, mostRecent: v.mostRecent };
      }
    });
    return { status: best!.status, count: best!.count, updated_at: best!.mostRecent, total: active.length };
  }, [votes]);

  return { votes, derived, loading: query.isLoading };
}

export function useCastLineVote(eventId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: LineStatus) => {
      if (!eventId || !user) throw new Error("missing");
      const { error } = await supabase
        .from("event_line_votes" as any)
        .upsert(
          { event_id: eventId, user_id: user.id, status, updated_at: new Date().toISOString() },
          { onConflict: "event_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["line-votes", eventId] }),
  });
}
