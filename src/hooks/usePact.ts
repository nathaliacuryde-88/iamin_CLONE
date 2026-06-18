import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Pact = {
  id: string;
  event_id: string;
  proposer_id: string;
  partner_id: string;
  status: "pending" | "sealed" | "declined" | "cancelled";
  sealed_at: string | null;
  created_at: string;
};

/** All pacts for an event involving the current user. */
export const usePactsForEvent = (eventId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["event-pacts", eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return [] as Pact[];
      const { data } = await supabase
        .from("event_pacts")
        .select("*")
        .eq("event_id", eventId)
        .or(`proposer_id.eq.${user.id},partner_id.eq.${user.id}`);
      return (data ?? []) as Pact[];
    },
    enabled: !!user && !!eventId,
  });
};

export const useProposePact = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ eventId, partnerId }: { eventId: string; partnerId: string }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("event_pacts")
        .insert({ event_id: eventId, proposer_id: user.id, partner_id: partnerId, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["event-pacts", vars.eventId] });
    },
  });
};

export const useRespondPact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pactId,
      status,
    }: {
      pactId: string;
      eventId: string;
      status: "sealed" | "declined" | "cancelled";
    }) => {
      const { error } = await supabase
        .from("event_pacts")
        .update({ status })
        .eq("id", pactId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["event-pacts", vars.eventId] });
      qc.invalidateQueries({ queryKey: ["event", vars.eventId] });
    },
  });
};

/** Mutual friends list with profiles, for the pact picker. */
export const useMutualFriends = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mutual-friends", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [{ data: out }, { data: incoming }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
        supabase.from("follows").select("follower_id").eq("following_id", user.id),
      ]);
      const outSet = new Set(out?.map((r) => r.following_id) ?? []);
      const mutual = (incoming ?? [])
        .map((r) => r.follower_id)
        .filter((id) => outSet.has(id));
      if (mutual.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username")
        .in("user_id", mutual);
      return profiles ?? [];
    },
    enabled: !!user,
  });
};
