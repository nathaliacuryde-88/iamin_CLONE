import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, parseISO, differenceInWeeks, isPast } from "date-fns";

/**
 * Streak = number of consecutive ISO weeks (Mon-start) the user attended at least
 * one event (status "going"). The current week counts only if the user already
 * attended an event this week.
 */
export const useStreak = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["streak", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Pull every "going" attendance + corresponding event date.
      const { data: attendances } = await supabase
        .from("attendees")
        .select("event_id, status")
        .eq("user_id", userId!)
        .eq("status", "going");
      const eventIds = (attendances ?? []).map((a) => a.event_id);
      if (eventIds.length === 0) return 0;

      const { data: events } = await supabase
        .from("events")
        .select("id, date")
        .in("id", eventIds);

      const weeks = new Set<number>();
      const todayWeek = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();

      (events ?? []).forEach((e) => {
        if (!e.date) return;
        const d = parseISO(e.date);
        // Only count past or current events (don't pre-credit future RSVPs).
        if (!isPast(d) && d.getTime() > Date.now()) return;
        const w = startOfWeek(d, { weekStartsOn: 1 }).getTime();
        weeks.add(w);
      });

      if (weeks.size === 0) return 0;

      // Walk back from current week as long as each prior week is in the set.
      // Streak only counts if user attended this week OR last week (allow a
      // single-week grace period before the streak resets so daylight users
      // don't lose it on Mondays).
      let streak = 0;
      let cursor = todayWeek;
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      // Allow grace: if not in current week, slide back one week to start counting.
      if (!weeks.has(cursor)) cursor -= oneWeekMs;
      while (weeks.has(cursor)) {
        streak += 1;
        cursor -= oneWeekMs;
      }
      return streak;
    },
  });
};
