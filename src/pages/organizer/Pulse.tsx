import { Link } from "react-router-dom";
import { useMemo } from "react";
import OrganizerLayout from "@/components/OrganizerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast, endOfDay, isFuture } from "date-fns";
import { ChevronRight } from "lucide-react";
import InsightCard from "@/components/organizer/InsightCard";
import { Skeleton } from "@/components/ui/skeleton";
import CrowdDNACard from "@/components/organizer/CrowdDNACard";
import SlippingAwayCard from "@/components/organizer/SlippingAwayCard";
import SuperHostsCard from "@/components/organizer/SuperHostsCard";
import { useAuth } from "@/hooks/useAuth";

const Pulse = () => {
  const { user } = useAuth();
  const { data: all = [], isLoading } = useOrganizerEvents();
  const past = useMemo(
    () => all.filter((e) => e.date && isPast(endOfDay(parseISO(e.date)))),
    [all],
  );
  const pastIds = useMemo(() => past.map((e) => e.id), [past]);
  const nextEventId = useMemo(() => {
    const upcoming = all
      .filter((e) => e.date && isFuture(endOfDay(parseISO(e.date))))
      .sort((a, b) => (a.date! < b.date! ? -1 : 1));
    return upcoming[0]?.id ?? null;
  }, [all]);


  const statsQueries = useQueries({
    queries: past.map((e) => ({
      queryKey: ["event-pulse-stats", e.id],
      queryFn: async () => {
        const { data } = await supabase.rpc("get_event_pulse_stats" as any, { _event_id: e.id });
        return (data as any[])?.[0] ?? { total_ratings: 0, fire_count: 0, mid_count: 0, flop_count: 0, avg_score: null };
      },
    })),
  });

  const overall = useMemo(() => {
    const scores: number[] = [];
    let polls = 0;
    statsQueries.forEach((q) => {
      const r = q.data as any;
      if (r?.avg_score != null) scores.push(Number(r.avg_score));
      polls += r?.total_ratings ?? 0;
    });
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return { avg, events: past.length, polls };
  }, [statsQueries, past.length]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (past.length >= 3) {
      const byDow: Record<string, number[]> = {};
      past.forEach((e, i) => {
        if (!e.date) return;
        const dow = format(parseISO(e.date), "EEEE");
        const score = (statsQueries[i].data as any)?.avg_score;
        if (score != null) (byDow[dow] ??= []).push(Number(score));
      });
      const ranked = Object.entries(byDow)
        .map(([d, arr]) => ({ d, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
        .sort((a, b) => b.avg - a.avg);
      if (ranked.length >= 2) {
        const diff = ((ranked[0].avg - ranked[ranked.length - 1].avg) / ranked[ranked.length - 1].avg) * 100;
        if (diff > 5) {
          out.push(
            `Your ${ranked[0].d} events score ${Math.round(diff)}% higher than ${ranked[ranked.length - 1].d}s.`,
          );
        }
      }
      // Best vibe
      const byVibe: Record<string, number[]> = {};
      past.forEach((e, i) => {
        const v = e.vibe_category?.trim();
        if (!v) return;
        const score = (statsQueries[i].data as any)?.avg_score;
        if (score != null) (byVibe[v] ??= []).push(Number(score));
      });
      const vibes = Object.entries(byVibe)
        .map(([v, arr]) => ({ v, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
        .sort((a, b) => b.avg - a.avg);
      if (vibes[0]) out.push(`Your top-rated vibe is ${vibes[0].v} at ${vibes[0].avg.toFixed(1)}/5.`);
    }
    if (past.length === 0) out.push("Run your first event to start building your track record.");
    return out;
  }, [past, statsQueries]);

  return (
    <OrganizerLayout>
      <div className="max-w-lg mx-auto pt-4 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Your track record</h1>

        <Card className="glass animate-fade-in">
          <CardContent className="p-6 text-center space-y-2">
            <div
              className="text-5xl mx-auto inline-block origin-bottom transition-transform duration-300 hover:scale-110 animate-medal-sway"
              aria-hidden
            >
              🏅
            </div>
            <p className="text-5xl font-bold tracking-tight">
              {overall.avg != null ? overall.avg.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              based on {overall.events} event{overall.events === 1 ? "" : "s"} · {overall.polls} exit poll
              {overall.polls === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <InsightCard insights={insights} />

        {user && (
          <>
            <CrowdDNACard eventIds={pastIds} />
            <SlippingAwayCard eventIds={pastIds} organizerId={user.id} />
            <SuperHostsCard eventIds={pastIds} organizerId={user.id} nextEventId={nextEventId} />
          </>
        )}

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Past events</p>
          {isLoading ? (
            <Skeleton className="h-20 rounded-2xl" />
          ) : past.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No past events yet.</p>
          ) : (
            past.map((e, i) => {
              const s = statsQueries[i].data as any;
              const total = s?.total_ratings ?? 0;
              const fire = total ? Math.round(((s?.fire_count ?? 0) / total) * 100) : 0;
              const mid = total ? Math.round(((s?.mid_count ?? 0) / total) * 100) : 0;
              const flop = total ? Math.round(((s?.flop_count ?? 0) / total) * 100) : 0;
              return (
                <Link key={e.id} to={`/organizer/pulse/${e.id}`} className="block">
                  <Card className="glass hover:border-primary/40 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{e.name}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            {e.date ? format(parseISO(e.date), "MMM d") : ""} · {e.going} attended
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold">{s?.avg_score ?? "—"}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>🔥 {fire}%</span>
                          <span>😐 {mid}%</span>
                          <span>💀 {flop}%</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default Pulse;
