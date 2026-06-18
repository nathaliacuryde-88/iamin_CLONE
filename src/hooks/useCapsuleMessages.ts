import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

export type CapsuleMessage = Tables<"time_capsule_messages"> & {
  profile?: Tables<"profiles"> | null;
};

const KEY = (eventId: string) => ["capsule-messages", eventId];

export const useCapsuleMessages = (eventId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEY(eventId ?? ""),
    enabled: !!eventId && !!user,
    queryFn: async (): Promise<CapsuleMessage[]> => {
      const { data, error } = await supabase
        .from("time_capsule_messages")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);
      const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
    },
  });
};

export const useSaveCapsuleMessage = (eventId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, content }: { id?: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      if (id) {
        const { data, error } = await supabase
          .from("time_capsule_messages")
          .update({ content })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("time_capsule_messages")
        .insert({ event_id: eventId, user_id: user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(eventId) }),
  });
};

export const useDeleteCapsuleMessage = (eventId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_capsule_messages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(eventId) }),
  });
};
