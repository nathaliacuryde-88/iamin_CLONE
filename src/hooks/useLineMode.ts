import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LineStatus = "walk_in" | "short_wait" | "long_wait" | "closed";

export type LineStatusRow = {
  id: string;
  event_id: string;
  session_id: string;
  status: LineStatus;
  note: string | null;
  created_by: string;
  created_at: string;
};

export type LineSession = {
  id: string;
  event_id: string;
  started_by: string;
  started_at: string;
  ended_at: string | null;
};

export const STATUS_META: Record<LineStatus, { label: string; emoji: string; dot: string; tint: string; border: string; pill: string }> = {
  walk_in:    { label: "Walk in",    emoji: "🟢", dot: "bg-[#22c97a]", tint: "bg-[#22c97a]/15", border: "border-[#22c97a]/50", pill: "bg-[#22c97a]/20 text-[#22c97a] border-[#22c97a]/40" },
  short_wait: { label: "Short wait", emoji: "🟡", dot: "bg-[#f5a623]", tint: "bg-[#f5a623]/15", border: "border-[#f5a623]/50", pill: "bg-[#f5a623]/20 text-[#f5a623] border-[#f5a623]/40" },
  long_wait:  { label: "Long wait",  emoji: "🔴", dot: "bg-[#e94f4f]", tint: "bg-[#e94f4f]/15", border: "border-[#e94f4f]/50", pill: "bg-[#e94f4f]/20 text-[#e94f4f] border-[#e94f4f]/40" },
  closed:     { label: "Closed",     emoji: "⛔", dot: "bg-[#888]",    tint: "bg-[#555]/20",    border: "border-[#555]/50",    pill: "bg-[#555]/30 text-muted-foreground border-[#555]/40" },
};

export const useLineMode = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = ["line-mode", eventId];

  const query = useQuery({
    queryKey: key,
    enabled: !!eventId,
    queryFn: async () => {
      const { data: session } = await supabase
        .from("event_line_sessions" as any)
        .select("*")
        .eq("event_id", eventId!)
        .is("ended_at", null)
        .maybeSingle();
      if (!session) return { session: null as LineSession | null, history: [] as LineStatusRow[] };
      const { data: history } = await supabase
        .from("event_line_status" as any)
        .select("*")
        .eq("session_id", (session as any).id)
        .order("created_at", { ascending: true });
      return { session: session as any as LineSession, history: (history ?? []) as any as LineStatusRow[] };
    },
  });

  // Realtime
  useEffect(() => {
    if (!eventId) return;
    const ch = supabase
      .channel(`line-mode-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_line_sessions", filter: `event_id=eq.${eventId}` },
        () => queryClient.invalidateQueries({ queryKey: key }))
      .on("postgres_changes", { event: "*", schema: "public", table: "event_line_status", filter: `event_id=eq.${eventId}` },
        () => queryClient.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const data = query.data ?? { session: null, history: [] };
  const current = data.history.length ? data.history[data.history.length - 1] : null;
  return {
    isActive: !!data.session,
    session: data.session,
    history: data.history,
    current,
    loading: query.isLoading,
  };
};

export const useLineModeMutations = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const key = ["line-mode", eventId];

  const activate = useMutation({
    mutationFn: async ({ status, note }: { status: LineStatus; note?: string }) => {
      if (!eventId || !user) throw new Error("missing");
      const { data: session, error } = await supabase
        .from("event_line_sessions" as any)
        .insert({ event_id: eventId, started_by: user.id })
        .select()
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("event_line_status" as any).insert({
        event_id: eventId, session_id: (session as any).id, status, note: note || null, created_by: user.id,
      });
      if (e2) throw e2;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ sessionId, status, note }: { sessionId: string; status: LineStatus; note?: string | null }) => {
      if (!eventId || !user) throw new Error("missing");
      const { error } = await supabase.from("event_line_status" as any).insert({
        event_id: eventId, session_id: sessionId, status, note: note ?? null, created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("event_line_sessions" as any)
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return { activate, setStatus, endSession };
};

export const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
