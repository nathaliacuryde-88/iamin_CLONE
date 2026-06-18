import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";

/**
 * Feed = events I created + events from people I follow.
 */
export const useEvents = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Mutual follows only (true friends), plus events I've been invited to
      const [{ data: out }, { data: incoming }, { data: invites }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
        supabase.from("follows").select("follower_id").eq("following_id", user.id),
        supabase.from("event_invites").select("event_id").eq("invitee_id", user.id),
      ]);
      const outSet = new Set((out ?? []).map((f) => f.following_id));
      const incSet = new Set((incoming ?? []).map((f) => f.follower_id));
      const friendIds = [...outSet].filter((id) => incSet.has(id));
      const allowedCreators = [user.id, ...friendIds];
      const invitedEventIds = (invites ?? []).map((i: any) => i.event_id);

      const baseQuery = supabase.from("events").select("*");
      const { data: events, error } = invitedEventIds.length > 0
        ? await baseQuery
            .or(`created_by.in.(${allowedCreators.join(",")}),id.in.(${invitedEventIds.join(",")})`)
            .order("date", { ascending: true })
        : await baseQuery.in("created_by", allowedCreators).order("date", { ascending: true });
      if (error) throw error;

      const eventIds = events.map((e) => e.id);
      const { data: attendees } = eventIds.length
        ? await supabase.from("attendees").select("*").in("event_id", eventIds)
        : { data: [] };

      const userIds = [
        ...new Set([
          ...(attendees?.map((a) => a.user_id) ?? []),
          ...events.map((e) => e.created_by),
        ]),
      ];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("*").in("user_id", userIds)
        : { data: [] };

      return events.map((event) => ({
        ...event,
        creator_profile: profiles?.find((p) => p.user_id === event.created_by) ?? null,
        attendees: (attendees ?? [])
          .filter((a) => a.event_id === event.id)
          .map((a) => ({
            ...a,
            profile: profiles?.find((p) => p.user_id === a.user_id) ?? null,
          })),
      }));
    },
    enabled: !!user,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  return { ...query, refetch };
};

type RsvpAction =
  | { kind: "delete"; eventId: string }
  | { kind: "update"; eventId: string; status: "going" | "interested" }
  | { kind: "insert"; eventId: string; status: "going" | "interested" };

/**
 * Optimistic RSVP mutation. Updates the cached events feed immediately, then
 * reconciles with the server. Rolls back on error.
 */
export const useRsvpMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const haptic = useHaptics();

  return useMutation({
    mutationFn: async (action: RsvpAction) => {
      if (!user) throw new Error("Not signed in");
      if (action.kind === "delete") {
        const { error } = await supabase
          .from("attendees")
          .delete()
          .eq("event_id", action.eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else if (action.kind === "update") {
        const { error } = await supabase
          .from("attendees")
          .update({ status: action.status })
          .eq("event_id", action.eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Upsert so a stale cache (e.g. City Pulse list that doesn't preload
        // the current user's attendance) doesn't trip the unique constraint.
        const { error } = await supabase
          .from("attendees")
          .upsert(
            { event_id: action.eventId, user_id: user.id, status: action.status },
            { onConflict: "event_id,user_id" }
          );
        if (error) throw error;
      }
    },
    onMutate: async (action) => {
      if (!user) return { previous: undefined };
      // Cancel + snapshot every query that holds an array of events so
      // optimistic updates apply to the feed (["events"]), profile
      // (["user-events"]), and any future event list keys.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["events"] }),
        queryClient.cancelQueries({ queryKey: ["user-events"] }),
        queryClient.cancelQueries({ queryKey: ["event"] }),
        queryClient.cancelQueries({ queryKey: ["city-pulse"] }),
      ]);
      const previous = [
        ...queryClient.getQueriesData({ queryKey: ["events"] }),
        ...queryClient.getQueriesData({ queryKey: ["user-events"] }),
        ...queryClient.getQueriesData({ queryKey: ["event"] }),
        ...queryClient.getQueriesData({ queryKey: ["city-pulse"] }),
      ];

      const applyToEvent = (event: any) => {
        if (event.id !== action.eventId) return event;
        const attendees = [...(event.attendees ?? [])];
        const idx = attendees.findIndex((a) => a.user_id === user.id);
        if (action.kind === "delete") {
          if (idx >= 0) attendees.splice(idx, 1);
        } else if (action.kind === "update") {
          if (idx >= 0) attendees[idx] = { ...attendees[idx], status: action.status };
          else attendees.push({ id: `optimistic-${Date.now()}`, event_id: action.eventId, user_id: user.id, status: action.status, created_at: new Date().toISOString(), profile: null });
        } else {
          const ownProfile = attendees.find((a) => a.profile)?.profile ?? null;
          attendees.push({
            id: `optimistic-${Date.now()}`,
            event_id: action.eventId,
            user_id: user.id,
            status: action.status,
            created_at: new Date().toISOString(),
            profile: ownProfile,
          });
        }
        return { ...event, attendees };
      };

      const updater = (old: any) => {
        if (Array.isArray(old)) return old.map(applyToEvent);
        if (old && typeof old === "object" && "id" in old) return applyToEvent(old);
        return old;
      };

      queryClient.setQueriesData({ queryKey: ["events"] }, updater);
      queryClient.setQueriesData({ queryKey: ["user-events"] }, updater);
      queryClient.setQueriesData({ queryKey: ["event"] }, updater);
      queryClient.setQueriesData({ queryKey: ["city-pulse"] }, updater);

      return { previous };
    },
    onError: (_err, _action, context) => {
      if (context?.previous) {
        for (const [key, value] of context.previous as [readonly unknown[], unknown][]) {
          queryClient.setQueryData(key, value);
        }
      }
      haptic("error");
      toast({
        title: "Couldn't save RSVP",
        description: "Try again in a moment.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      queryClient.invalidateQueries({ queryKey: ["city-pulse"] });
    },
  });
};
