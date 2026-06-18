import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Activity, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import { differenceInHours, parseISO } from "date-fns";

interface Props {
  eventId: string;
  eventDate: string | null;
  eventTime: string | null;
  isAttending: boolean;
  isOwner: boolean;
  goingCount: number;
}

/**
 * "Are we actually doing this?" pulse.
 * Surfaces in the 48h before an event when momentum is uncertain.
 * Anyone going can start a pulse; attendees vote yes/no anonymously.
 */
const EventPulseSection = ({ eventId, eventDate, eventTime, isAttending, isOwner, goingCount }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const haptic = useHaptics();
  const { toast } = useToast();

  const hoursUntil = useMemo(() => {
    if (!eventDate) return Infinity;
    const dt = parseISO(`${eventDate}T${eventTime ?? "23:59"}`);
    return differenceInHours(dt, new Date());
  }, [eventDate, eventTime]);

  const isUpcomingSoon = hoursUntil >= 0 && hoursUntil <= 48;
  const lowMomentum = goingCount < 4;
  const canSeeOrStart = (isAttending || isOwner) && isUpcomingSoon;

  const { data: pulse } = useQuery({
    queryKey: ["event-pulse", eventId],
    enabled: !!user && canSeeOrStart,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_pulses" as any)
        .select("*")
        .eq("event_id", eventId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });

  const { data: votes = [] } = useQuery({
    queryKey: ["event-pulse-votes", pulse?.id],
    enabled: !!pulse?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_pulse_votes" as any)
        .select("vote, user_id")
        .eq("pulse_id", pulse!.id);
      return ((data ?? []) as unknown) as { vote: "yes" | "no"; user_id: string }[];
    },
  });

  const myVote = votes.find((v) => v.user_id === user?.id)?.vote ?? null;
  const yes = votes.filter((v) => v.vote === "yes").length;
  const no = votes.filter((v) => v.vote === "no").length;
  const total = yes + no;
  const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;

  const startPulse = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("event_pulses" as any).insert({
        event_id: eventId,
        started_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      haptic("medium");
      qc.invalidateQueries({ queryKey: ["event-pulse", eventId] });
      toast({ title: "Pulse started — friends will see it" });
    },
    onError: (e: any) => toast({ title: "Couldn't start", description: e.message, variant: "destructive" }),
  });

  const castVote = useMutation({
    mutationFn: async (vote: "yes" | "no") => {
      if (!user || !pulse?.id) throw new Error("No pulse");
      const { error } = await supabase
        .from("event_pulse_votes" as any)
        .upsert(
          { pulse_id: pulse.id, user_id: user.id, vote },
          { onConflict: "pulse_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_d, vote) => {
      haptic(vote === "yes" ? "success" : "light");
      qc.invalidateQueries({ queryKey: ["event-pulse-votes", pulse?.id] });
    },
    onError: (e: any) => toast({ title: "Vote failed", description: e.message, variant: "destructive" }),
  });

  if (!canSeeOrStart) return null;
  // Only show the start-CTA when there's no active pulse AND momentum is shaky.
  if (!pulse && !lowMomentum) return null;

  return (
    <div className="tactile-widget p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Are we actually doing this?</h3>
      </div>

      {!pulse ? (
        <>
          <p className="text-xs text-muted-foreground">
            Only {goingCount} {goingCount === 1 ? "person" : "people"} confirmed. Send up a flare and see who's still in.
          </p>
          <Button
            size="sm"
            className="w-full glow-sm"
            onClick={() => startPulse.mutate()}
            disabled={startPulse.isPending}
          >
            {startPulse.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send pulse"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total === 0
              ? "Be the first to weigh in — anonymous to everyone else."
              : `${total} ${total === 1 ? "vote" : "votes"} so far · anonymous`}
          </p>

          {total > 0 && (
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yesPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-primary"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={myVote === "yes" ? "default" : "outline"}
              onClick={() => castVote.mutate("yes")}
              disabled={castVote.isPending}
              className={myVote === "yes" ? "glow-sm" : ""}
            >
              ✋ I'm in {total > 0 && <span className="ml-1 opacity-70">{yes}</span>}
            </Button>
            <Button
              size="sm"
              variant={myVote === "no" ? "default" : "outline"}
              onClick={() => castVote.mutate("no")}
              disabled={castVote.isPending}
            >
              👻 Let it fade {total > 0 && <span className="ml-1 opacity-70">{no}</span>}
            </Button>
          </div>

          {isOwner && total >= 3 && (
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              {yesPct >= 50 ? "Push harder — momentum is there." : "It's drifting — maybe let it go."}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default EventPulseSection;
