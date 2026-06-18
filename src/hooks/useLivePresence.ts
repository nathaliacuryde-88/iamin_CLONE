import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PresenceStatus = "on_the_way" | "here" | "left";

export type PresenceRow = {
  id: string;
  event_id: string;
  user_id: string;
  status: PresenceStatus;
  lat: number | null;
  lng: number | null;
  updated_at: string;
  expires_at: string;
};

export const useLivePresence = (eventId: string | undefined) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`live_presence:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_presence", filter: `event_id=eq.${eventId}` },
        () => qc.invalidateQueries({ queryKey: ["live-presence", eventId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, qc]);

  return useQuery({
    queryKey: ["live-presence", eventId],
    queryFn: async () => {
      if (!eventId) return [] as PresenceRow[];
      const { data } = await supabase
        .from("live_presence")
        .select("*")
        .eq("event_id", eventId)
        .gt("expires_at", new Date().toISOString())
        .order("updated_at", { ascending: false });
      return (data ?? []) as PresenceRow[];
    },
    enabled: !!eventId,
    staleTime: 15_000,
  });
};

export const useSetPresence = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      eventId,
      status,
      lat,
      lng,
    }: {
      eventId: string;
      status: PresenceStatus;
      lat?: number | null;
      lng?: number | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      // Upsert via delete-then-insert to keep policy simple (unique on event/user not enforced)
      await supabase
        .from("live_presence")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      if (status === "left") return; // user clears their presence
      const { error } = await supabase.from("live_presence").insert({
        event_id: eventId,
        user_id: user.id,
        status,
        lat: lat ?? null,
        lng: lng ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["live-presence", vars.eventId] });
    },
  });
};
