import type { Tables } from "@/integrations/supabase/types";
import { isToday, isTomorrow, parseISO } from "date-fns";

export type RouletteEvent = Tables<"events"> & {
  attendees?: { user_id: string; status: string }[];
};

export interface ScoredEvent {
  event: RouletteEvent;
  score: number;
  reasons: string[];
  friendsGoing: { user_id: string; status: string }[];
}

interface Ctx {
  /** mutual friend user ids */
  friendIds: Set<string>;
  /** vibe_category -> count of past 🔥 ratings */
  taste: Map<string, number>;
  /** display name lookup for friends */
  friendNames: Map<string, string>;
}

const eventStart = (e: RouletteEvent) => {
  if (!e.date) return Infinity;
  const time = (e as any).time as string | null | undefined;
  const t = time?.match(/^\d{2}:\d{2}/)?.[0] ?? "20:00";
  return new Date(`${e.date}T${t}:00`).getTime();
};

const isLiveNow = (e: RouletteEvent) => {
  const start = eventStart(e);
  if (!Number.isFinite(start)) return false;
  const now = Date.now();
  return now >= start && now <= start + 4 * 60 * 60 * 1000;
};

export function scoreEvents(events: RouletteEvent[], ctx: Ctx): ScoredEvent[] {
  const now = Date.now();
  const tasteMax = Math.max(1, ...Array.from(ctx.taste.values()));

  return events
    .filter((e) => e.date && eventStart(e) + 60 * 60 * 1000 > now) // upcoming or live
    .map((e) => {
      const friendsGoing = (e.attendees ?? []).filter(
        (a) => ctx.friendIds.has(a.user_id) && (a.status === "going" || a.status === "interested"),
      );

      let score = 1;
      const reasons: string[] = [];

      // friends free (heaviest)
      if (friendsGoing.length > 0) {
        score += friendsGoing.length * 3;
        const first = ctx.friendNames.get(friendsGoing[0].user_id) ?? "A friend";
        const extra = friendsGoing.length - 1;
        reasons.push(
          extra > 0 ? `${first} +${extra} are in — you always end up there` : `${first} is in`,
        );
      }

      // when
      const date = parseISO(e.date as string);
      if (isLiveNow(e)) {
        score *= 2;
        reasons.push("it's live right now");
      } else if (isToday(date)) {
        score *= 1.5;
        reasons.push("tonight");
      } else if (isTomorrow(date)) {
        score *= 1.2;
        reasons.push("tomorrow");
      }

      // taste
      const vibe = (e as any).vibe_category as string | null;
      if (vibe) {
        const taste = ctx.taste.get(vibe) ?? 0;
        if (taste > 0) {
          score *= 1 + taste / tasteMax;
          reasons.push(`you always rate ${vibe} parties 🔥`);
        }
      }

      return { event: e, score, reasons, friendsGoing };
    })
    .sort((a, b) => b.score - a.score);
}

/** Weighted-random pick using scores (informed chaos). */
export function weightedPick(scored: ScoredEvent[]): ScoredEvent | null {
  if (!scored.length) return null;
  const total = scored.reduce((s, x) => s + x.score, 0);
  let r = Math.random() * total;
  for (const s of scored) {
    r -= s.score;
    if (r <= 0) return s;
  }
  return scored[0];
}
