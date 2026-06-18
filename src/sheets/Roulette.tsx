import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { isToday, isTomorrow, parseISO, addDays } from "date-fns";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Dices, RotateCw } from "lucide-react";
import { parseCoverMeta } from "@/lib/coverMeta";
import { useEvents, useRsvpMutation } from "@/hooks/useEvents";
import { useFriendIds } from "@/hooks/useFriendIds";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";
import BlurImage from "@/components/BlurImage";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type AnyEvent = any;

interface Candidate {
  event: AnyEvent;
  friendsGoing: { user_id: string; status: string }[];
  affinity: number;
  score: number;
  reason: string;
}

const STEPS = 22;
const tickDelay = (i: number) => 45 + Math.pow(i / STEPS, 2) * 230;

const eventStartMs = (e: AnyEvent) => {
  if (!e.date) return Infinity;
  const t = (e.time as string | null | undefined)?.match(/^\d{2}:\d{2}/)?.[0] ?? "20:00";
  return new Date(`${e.date}T${t}:00`).getTime();
};

const eventEndMs = (e: AnyEvent) => {
  const start = eventStartMs(e);
  if (!Number.isFinite(start)) return Infinity;
  // assume 4h default duration
  return start + 4 * 60 * 60 * 1000;
};

const isLiveNow = (e: AnyEvent) => {
  const now = Date.now();
  return now >= eventStartMs(e) && now <= eventEndMs(e);
};

const isThisWeek = (e: AnyEvent) => {
  if (!e.date) return false;
  const d = parseISO(e.date);
  const now = new Date();
  return d <= addDays(now, 7) && d >= now;
};

function scoreCandidate(
  e: AnyEvent,
  friendIds: Set<string>,
  taste: Map<string, number>,
  friendNames: Map<string, string>,
): Candidate {
  const friendsGoing = ((e.attendees ?? []) as any[]).filter(
    (a) => friendIds.has(a.user_id) && (a.status === "going" || a.status === "interested"),
  );
  const vibe = (e.vibe_category as string | null) ?? null;
  const affinity = vibe ? taste.get(vibe) ?? 0 : 0;

  let score = 1;
  score += 2.2 * friendsGoing.length;

  const reasons: string[] = [];

  if (isLiveNow(e)) {
    score += 4;
    reasons.push("it's happening RIGHT NOW 🔴");
  } else if (e.date) {
    const d = parseISO(e.date);
    if (isToday(d)) {
      score += 3;
      reasons.push("tonight");
    } else if (isTomorrow(d)) {
      score += 3;
      reasons.push("tomorrow");
    } else if (isThisWeek(e)) {
      score += 1.2;
      reasons.push("this week");
    }
  }

  score += affinity;

  if (friendsGoing.length > 0) {
    const first = friendNames.get(friendsGoing[0].user_id) ?? "A friend";
    const extra = friendsGoing.length - 1;
    reasons.unshift(extra > 0 ? `${first} +${extra} are in` : `${first} is in`);
  }
  if (affinity > 0 && vibe) {
    reasons.push(`right up your alley 🔥`);
  }

  const reason = reasons.slice(0, 2).join(" · ") || "the dice just feel it";
  return { event: e, friendsGoing, affinity, score, reason };
}

function weightedPick(cands: Candidate[]): Candidate | null {
  if (!cands.length) return null;
  const total = cands.reduce((s, c) => s + Math.max(0.0001, c.score), 0);
  let r = Math.random() * total;
  for (const c of cands) {
    r -= Math.max(0.0001, c.score);
    if (r <= 0) return c;
  }
  return cands[cands.length - 1];
}

const Roulette = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptic = useHaptics();
  const { user } = useAuth();
  const { data: events = [] } = useEvents();
  const { data: friendIds = [] } = useFriendIds();
  const rsvp = useRsvpMutation();

  const { data: taste } = useQuery({
    queryKey: ["roulette-taste", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_ratings")
        .select("event:events!inner(vibe_category)")
        .eq("user_id", user!.id)
        .eq("rating", "fire");
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const v = r.event?.vibe_category;
        if (v) map.set(v, (map.get(v) ?? 0) + 1);
      });
      return map;
    },
  });

  const { data: friendNames } = useQuery({
    queryKey: ["roulette-friend-names", friendIds.length],
    enabled: friendIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", friendIds);
      return new Map((data ?? []).map((p: any) => [p.user_id, p.display_name ?? p.username ?? "Friend"]));
    },
  });

  const candidates = useMemo<Candidate[]>(() => {
    const friendSet = new Set(friendIds);
    const tasteMap = taste ?? new Map<string, number>();
    const nameMap = friendNames ?? new Map<string, string>();
    const now = Date.now();
    return (events as AnyEvent[])
      .filter((e) => e.date && eventEndMs(e) > now)
      .map((e) => scoreCandidate(e, friendSet, tasteMap, nameMap));
  }, [events, friendIds, taste, friendNames]);

  const [displayIdx, setDisplayIdx] = useState(0);
  const [winner, setWinner] = useState<Candidate | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const spin = () => {
    if (!candidates.length) return;
    clearTimer();
    setWinner(null);
    setSpinning(true);
    haptic("medium");

    const finalWinner = weightedPick(candidates)!;
    const finalIdx = candidates.findIndex((c) => c.event.id === finalWinner.event.id);

    let i = 0;
    const tick = () => {
      if (i >= STEPS) {
        setDisplayIdx(finalIdx);
        setWinner(finalWinner);
        setSpinning(false);
        haptic("success");
        return;
      }
      // mid-spin: random; final few ticks: bias toward winner
      let next: number;
      if (i >= STEPS - 1) {
        next = finalIdx;
      } else {
        next = Math.floor(Math.random() * candidates.length);
        if (next === displayIdx && candidates.length > 1) {
          next = (next + 1) % candidates.length;
        }
      }
      setDisplayIdx(next);
      haptic("selection");
      i++;
      timerRef.current = window.setTimeout(tick, tickDelay(i));
    };

    timerRef.current = window.setTimeout(tick, tickDelay(0));
  };

  useEffect(() => {
    if (open && candidates.length) {
      const id = window.setTimeout(spin, 280);
      return () => window.clearTimeout(id);
    }
    if (!open) {
      clearTimer();
      setWinner(null);
      setSpinning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, candidates.length]);

  useEffect(() => () => clearTimer(), []);

  const current = candidates[displayIdx];

  const handleImIn = async () => {
    if (!winner || !user) return;
    try {
      await rsvp.mutateAsync({ kind: "insert", eventId: winner.event.id, status: "going" });
      haptic("success");
      onOpenChange(false);
      navigate(`/event/${winner.event.id}`);
    } catch {
      /* toast in mutation */
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88dvh] overflow-hidden p-0">
        <DrawerTitle className="sr-only">Decision Roulette</DrawerTitle>
        <div className="px-6 pt-2 pb-2 text-center">
          <h2 className="text-base font-bold inline-flex items-center gap-2">
            {t("roulette.title", { defaultValue: "Can't decide?" })}
            <span aria-hidden>🎲</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("roulette.subtitle_new", {
              defaultValue: "Spin it — informed chaos.",
            })}
          </p>

        </div>

        <div className="px-5 pb-6 pt-3">
          <div className="rounded-3xl border border-border/60 bg-card/40 p-5 min-h-[260px] flex flex-col items-center justify-center">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">
                {t("roulette.empty", { defaultValue: "No upcoming events to spin." })}
              </p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${displayIdx}-${spinning ? "s" : "f"}`}
                  initial={
                    spinning
                      ? { opacity: 0.3, y: 14, filter: "blur(3px)", scale: 1 }
                      : { opacity: 0, scale: 0.86, filter: "blur(0px)", y: 0 }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                  transition={
                    spinning
                      ? { duration: 0.12, ease: "easeOut" }
                      : { type: "spring", stiffness: 360, damping: 14 }
                  }
                  className="flex flex-col items-center text-center w-full"
                >
                  {(() => {
                    const ev = current?.event as any;
                    const cover = ev ? parseCoverMeta(ev) : null;
                    if (ev?.image_url) {
                      return (
                        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-secondary mb-3">
                          <BlurImage src={ev.image_url} alt="" className="w-full h-full" />
                        </div>
                      );
                    }
                    if (cover) {
                      return (
                        <div
                          className="h-20 w-20 rounded-2xl overflow-hidden mb-3 flex items-center justify-center text-4xl"
                          style={{ background: `hsl(${cover.color})` }}
                        >
                          {cover.emoji}
                        </div>
                      );
                    }
                    return (
                      <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/20 mb-3 flex items-center justify-center text-3xl">
                        🎲
                      </div>
                    );
                  })()}

                  <p className="font-bold text-foreground text-lg leading-tight px-2">
                    {current?.event.name}
                  </p>
                  {current?.event.city && (
                    <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                      <span aria-hidden>📍</span>
                      {current.event.city}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Reason — fades in after landing */}
          <AnimatePresence>
            {winner && (
              <motion.p
                key="reason"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="text-center text-sm mt-4 px-3 text-muted-foreground"
              >
                <span className="font-semibold text-primary">
                  {t("roulette.dice_say", { defaultValue: "The dice say:" })}
                </span>{" "}
                {winner.reason}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <AnimatePresence>
            {winner && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="mt-5 flex gap-2"
              >
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={spin}
                  disabled={spinning}
                >
                  <RotateCw className="h-4 w-4 mr-1.5" />
                  {t("roulette.again", { defaultValue: "Spin again" })}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleImIn}
                  disabled={rsvp.isPending}
                >
                  {t("roulette.im_in", { defaultValue: "I am in" })}
                </Button>

              </motion.div>
            )}
          </AnimatePresence>

          {!winner && candidates.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-4 inline-flex items-center justify-center w-full gap-1.5">
              <Dices className="h-3.5 w-3.5" />
              {spinning
                ? t("roulette.spinning", { defaultValue: "Rolling…" })
                : t("roulette.idle", { defaultValue: "Tap below to roll" })}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default Roulette;
