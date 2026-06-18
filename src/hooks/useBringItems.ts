import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BringItemClaim {
  id: string;
  item_id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export interface BringItem {
  id: string;
  event_id: string;
  label: string;
  created_by: string;
  created_at: string;
  claims: BringItemClaim[];
}

export const useBringItems = (eventId: string | undefined) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["bring-items", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const [{ data: items, error: itemsErr }, { data: claims, error: claimsErr }] =
        await Promise.all([
          supabase
            .from("event_bring_items")
            .select("id,event_id,label,created_by,created_at")
            .eq("event_id", eventId!)
            .order("created_at", { ascending: true }),
          supabase
            .from("event_bring_item_claims")
            .select("id,item_id,user_id,event_id,created_at")
            .eq("event_id", eventId!),
        ]);
      if (itemsErr) throw itemsErr;
      if (claimsErr) throw claimsErr;

      return (items ?? []).map((it) => ({
        ...it,
        claims: (claims ?? []).filter((c) => c.item_id === it.id),
      })) as BringItem[];
    },
  });

  // Realtime sync items + claims as they come in.
  useEffect(() => {
    if (!eventId) return;
    const invalidate = () =>
      qc.invalidateQueries({ queryKey: ["bring-items", eventId] });
    const channel = supabase
      .channel(`bring-${eventId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_bring_items",
          filter: `event_id=eq.${eventId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_bring_item_claims",
          filter: `event_id=eq.${eventId}`,
        },
        invalidate
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, qc]);

  return query;
};

export const useAddBringItem = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, label }: { eventId: string; label: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("event_bring_items").insert({
        event_id: eventId,
        label: label.trim(),
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["bring-items", vars.eventId] }),
  });
};

export const useToggleClaim = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      eventId,
      claim,
    }: {
      itemId: string;
      eventId: string;
      claim: boolean;
    }) => {
      if (!user) throw new Error("Not signed in");
      if (claim) {
        const { error } = await supabase
          .from("event_bring_item_claims")
          .insert({ item_id: itemId, user_id: user.id, event_id: eventId });
        if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("event_bring_item_claims")
          .delete()
          .eq("item_id", itemId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onMutate: async ({ itemId, eventId, claim }) => {
      await qc.cancelQueries({ queryKey: ["bring-items", eventId] });
      const prev = qc.getQueryData<BringItem[]>(["bring-items", eventId]);
      qc.setQueryData<BringItem[]>(["bring-items", eventId], (old) =>
        (old ?? []).map((i) => {
          if (i.id !== itemId) return i;
          const mineExists = i.claims.some((c) => c.user_id === user?.id);
          if (claim && !mineExists) {
            return {
              ...i,
              claims: [
                ...i.claims,
                {
                  id: `optimistic-${Date.now()}`,
                  item_id: i.id,
                  event_id: eventId,
                  user_id: user!.id,
                  created_at: new Date().toISOString(),
                },
              ],
            };
          }
          if (!claim) {
            return {
              ...i,
              claims: i.claims.filter((c) => c.user_id !== user?.id),
            };
          }
          return i;
        })
      );
      return { prev };
    },
    onError: (_e, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["bring-items", vars.eventId], ctx.prev);
    },
    onSettled: (_d, _e, vars) =>
      qc.invalidateQueries({ queryKey: ["bring-items", vars.eventId] }),
  });
};

export const useDeleteBringItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string; eventId: string }) => {
      const { error } = await supabase
        .from("event_bring_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["bring-items", vars.eventId] }),
  });
};
