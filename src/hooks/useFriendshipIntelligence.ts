import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isPast, endOfDay, parseISO } from "date-fns";

export type Archetype = {
  key: "catalyst" | "ghost" | "planner" | "maybe" | "regular";
  emoji: string;
  label: string;
  description: string;
};

const ARCHETYPES: Record<Archetype["key"], Archetype> = {
  catalyst: {
    key: "catalyst",
    emoji: "🔥",
    label: "The Catalyst",
    description: "You're the reason nights happen. Plans bend around you.",
  },
  ghost: {
    key: "ghost",
    emoji: "👻",
    label: "The Ghost",
    description: "Confirms. Vanishes. A legend, in the worst way.",
  },
  planner: {
    key: "planner",
    emoji: "🗓️",
    label: "The Planner",
    description: "Locks the spot, splits the bill, runs the group chat.",
  },
  maybe: {
    key: "maybe",
    emoji: "🤷",
    label: "The Maybe",
    description: "Forever undecided. The group has noticed.",
  },
  regular: {
    key: "regular",
    emoji: "🥂",
    label: "The Regular",
    description: "Solid attendance, no drama. The backbone of every night.",
  },
};

export type TopFriend = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  shared: number;
  line: string;
};

export type FriendshipIntelligence = {
  archetype: Archetype;
  keyStat: { value: string; label: string };
  topFriends: TopFriend[];
  year: {
    attended: number;
    organised: number;
    spentCents: number;
    owedCents: number;
    cities: number;
    topNight: { name: string; rating: string } | null;
    streak: number;
  };
  receipts: string[];
  honesty: {
    pct: number;
    label: string;
    confirmed: number;
    showedUp: number;
  };
  hasEnoughData: boolean;
};

function honestyLabel(pct: number): string {
  if (pct >= 90) return "You show up. Rare.";
  if (pct >= 70) return "Pretty reliable, honestly.";
  if (pct >= 50) return "Room for improvement.";
  return "The group has noticed.";
}

function formatCents(cents: number, currency = "EUR") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

export function useFriendshipIntelligence() {
  const { user } = useAuth();

  return useQuery<FriendshipIntelligence>({
    queryKey: ["friendship-intelligence", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const yearStart = `${new Date().getFullYear()}-01-01`;

      const [
        { data: myAttendees },
        { data: myEvents },
        { data: myRatings },
        { data: myExpenses },
        { data: myShares },
      ] = await Promise.all([
        supabase.from("attendees").select("event_id, status").eq("user_id", uid),
        supabase.from("events").select("id, name, date, city, created_by").eq("created_by", uid),
        supabase.from("event_ratings").select("event_id, rating").eq("user_id", uid),
        (supabase as any).from("event_expenses").select("id, payer_id, amount_cents, event_id"),
        (supabase as any).from("expense_shares").select("expense_id, user_id, share_cents, settled_at"),
      ]);

      const goingIds = (myAttendees ?? [])
        .filter((a: any) => a.status === "going")
        .map((a: any) => a.event_id as string);
      const maybeCount = (myAttendees ?? []).filter((a: any) => a.status === "interested").length;

      // Fetch all events the user is associated with
      const allEventIds = Array.from(new Set([...goingIds, ...(myEvents ?? []).map((e: any) => e.id)]));
      const { data: allEvents } = allEventIds.length
        ? await supabase.from("events").select("id, name, date, city, created_by").in("id", allEventIds)
        : { data: [] as any[] };

      const now = new Date();
      const pastEvents = (allEvents ?? []).filter(
        (e: any) => e.date && isPast(endOfDay(parseISO(e.date)))
      );
      const pastThisYear = pastEvents.filter((e: any) => e.date >= yearStart);
      const organisedThisYear = (myEvents ?? []).filter(
        (e: any) => e.date && e.date >= yearStart && isPast(endOfDay(parseISO(e.date)))
      );

      // Cities this year
      const cities = new Set(
        pastThisYear.map((e: any) => (e.city ?? "").trim().toLowerCase()).filter(Boolean)
      );

      // Top night = highest of user's own ratings (fire > mid > flop)
      const ratingScore: Record<string, number> = { fire: 3, mid: 2, flop: 1 };
      let topNight: { name: string; rating: string } | null = null;
      let bestScore = 0;
      for (const r of myRatings ?? []) {
        const s = ratingScore[r.rating as string] ?? 0;
        if (s > bestScore) {
          const ev = (allEvents ?? []).find((e: any) => e.id === r.event_id);
          if (ev) {
            bestScore = s;
            topNight = { name: ev.name, rating: r.rating === "fire" ? "🔥" : r.rating === "mid" ? "😐" : "💀" };
          }
        }
      }

      // Tab math
      let spentCents = 0; // what others owe me (I paid)
      let owedCents = 0; // what I owe others
      const perFriendBalance = new Map<string, number>(); // +ve = friend owes me
      for (const exp of (myExpenses ?? []) as any[]) {
        const shares = ((myShares ?? []) as any[]).filter((s) => s.expense_id === exp.id);
        if (exp.payer_id === uid) {
          for (const s of shares) {
            if (s.user_id !== uid && !s.settled_at) {
              spentCents += s.share_cents;
              perFriendBalance.set(s.user_id, (perFriendBalance.get(s.user_id) ?? 0) + s.share_cents);
            }
          }
        } else {
          for (const s of shares) {
            if (s.user_id === uid && !s.settled_at) {
              owedCents += s.share_cents;
              perFriendBalance.set(exp.payer_id, (perFriendBalance.get(exp.payer_id) ?? 0) - s.share_cents);
            }
          }
        }
      }

      // Top friends by shared attendance
      const myGoingSet = new Set(goingIds);
      const { data: coAttendees } = goingIds.length
        ? await supabase.from("attendees").select("event_id, user_id").in("event_id", goingIds).eq("status", "going")
        : { data: [] as any[] };
      const sharedMap = new Map<string, number>();
      for (const a of (coAttendees ?? []) as any[]) {
        if (a.user_id === uid) continue;
        sharedMap.set(a.user_id, (sharedMap.get(a.user_id) ?? 0) + 1);
      }
      const topIds = [...sharedMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const { data: topProfiles } = topIds.length
        ? await supabase.from("profiles").select("user_id, display_name, avatar_url, username").in("user_id", topIds.map(([id]) => id))
        : { data: [] as any[] };

      const topFriends: TopFriend[] = topIds.map(([id, count], idx) => {
        const p = (topProfiles ?? []).find((pp: any) => pp.user_id === id);
        const balance = perFriendBalance.get(id) ?? 0;
        let line: string;
        if (idx === 0) line = "Your most consistent going-out partner";
        else if (Math.abs(balance) < 200) line = "Financially you're basically even";
        else if (balance > 0) line = `They owe you ${formatCents(balance)} on the Tab`;
        else line = `You're up ${formatCents(-balance)} on the Tab between you`;
        return {
          user_id: id,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          username: p?.username ?? null,
          shared: count,
          line,
        };
      });

      // Honesty: confirmed 'going' on past events vs "showed up" proxy (rated OR uploaded a photo OR was the creator)
      const confirmedPastIds = goingIds.filter((id) => {
        const ev = (allEvents ?? []).find((e: any) => e.id === id);
        return ev?.date && isPast(endOfDay(parseISO(ev.date)));
      });
      const ratedSet = new Set((myRatings ?? []).map((r: any) => r.event_id));
      const { data: myPhotos } = confirmedPastIds.length
        ? await supabase.from("time_capsule_photos").select("event_id").eq("user_id", uid).in("event_id", confirmedPastIds)
        : { data: [] as any[] };
      const photoSet = new Set((myPhotos ?? []).map((p: any) => p.event_id));
      const createdSet = new Set((myEvents ?? []).map((e: any) => e.id));
      const showedUp = confirmedPastIds.filter(
        (id) => ratedSet.has(id) || photoSet.has(id) || createdSet.has(id)
      ).length;
      const pct = confirmedPastIds.length === 0 ? 0 : Math.round((showedUp / confirmedPastIds.length) * 100);

      // Archetype derivation
      const organisedAll = (myEvents ?? []).length;
      const attendedAll = goingIds.length;
      let archetypeKey: Archetype["key"] = "regular";
      if (organisedAll >= Math.max(3, attendedAll * 0.4)) archetypeKey = "catalyst";
      else if (confirmedPastIds.length >= 3 && pct < 60) archetypeKey = "ghost";
      else if (maybeCount >= 5 && maybeCount > attendedAll) archetypeKey = "maybe";
      else if ((myExpenses ?? []).length >= 3) archetypeKey = "planner";

      // Streak: count past events going, ordered by date desc, attended in a row
      const sortedPast = [...confirmedPastIds]
        .map((id) => (allEvents ?? []).find((e: any) => e.id === id))
        .filter(Boolean)
        .sort((a: any, b: any) => (b.date ?? "").localeCompare(a.date ?? ""));
      let streak = 0;
      for (const ev of sortedPast) {
        if (ratedSet.has((ev as any).id) || photoSet.has((ev as any).id) || createdSet.has((ev as any).id)) streak++;
        else break;
      }

      // Receipts (rotate weekly)
      const candidates: string[] = [];
      if (topFriends[0]) {
        candidates.push(
          `You and ${topFriends[0].display_name ?? "your top friend"} have shared ${topFriends[0].shared} event${topFriends[0].shared === 1 ? "" : "s"}.`
        );
      }
      candidates.push(
        `You've confirmed IN ${confirmedPastIds.length} times this year and showed up ${showedUp} times. ${pct}% follow-through.`
      );
      if (cities.size > 1) candidates.push(`You've gone out in ${cities.size} different cities this year.`);
      if (organisedAll > 0) candidates.push(`You've hosted ${organisedAll} event${organisedAll === 1 ? "" : "s"}. Catalyst energy.`);
      if (spentCents > 0) candidates.push(`Friends owe you ${formatCents(spentCents)} on the Tab. Call it in.`);
      if (owedCents > spentCents) candidates.push(`You owe ${formatCents(owedCents)} on the Tab. Settle up.`);

      const weekIdx = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
      const receipts: string[] = [];
      for (let i = 0; i < Math.min(3, candidates.length); i++) {
        receipts.push(candidates[(weekIdx + i) % candidates.length]);
      }

      const archetype = ARCHETYPES[archetypeKey];
      const keyStat = {
        value: String(pastThisYear.length || attendedAll),
        label: pastThisYear.length ? "events this year" : "events total",
      };

      return {
        archetype,
        keyStat,
        topFriends,
        year: {
          attended: pastThisYear.length,
          organised: organisedThisYear.length,
          spentCents,
          owedCents,
          cities: cities.size,
          topNight,
          streak,
        },
        receipts,
        honesty: {
          pct,
          label: honestyLabel(pct),
          confirmed: confirmedPastIds.length,
          showedUp,
        },
        hasEnoughData: attendedAll + organisedAll >= 2,
      };
    },
  });
}

export { ARCHETYPES };
