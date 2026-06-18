import { useMemo, useState } from "react";
import { Bell, Users, Loader2 } from "lucide-react";
import { STATUS_META, formatRelative, useLineMode, type LineStatus } from "@/hooks/useLineMode";
import { useLineVotes, useCastLineVote } from "@/hooks/useLineVotes";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  eventId: string;
}

const ORDER: LineStatus[] = ["walk_in", "short_wait", "long_wait", "closed"];
const COLORS: Record<LineStatus, string> = {
  walk_in: "#22c97a",
  short_wait: "#f5a623",
  long_wait: "#e94f4f",
  closed: "#a855f7",
};

/**
 * Crowd-sourced live door radar. Attendees vote what they see at the door,
 * the bar shows distribution, and the headline status is the most-voted in
 * the last 30 min.
 */
const LineModeAttendeeView = ({ eventId }: Props) => {
  const { isActive, current: organizerCurrent } = useLineMode(eventId);
  const { votes, derived } = useLineVotes(eventId);
  const castVote = useCastLineVote(eventId);
  const { user } = useAuth();
  const haptic = useHaptics();
  const { toast } = useToast();
  const [pingArmed, setPingArmed] = useState(false);

  const headline: LineStatus | null = derived?.status ?? organizerCurrent?.status ?? null;
  const totalReports = derived?.total ?? 0;

  const counts = useMemo(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const map: Record<LineStatus, number> = { walk_in: 0, short_wait: 0, long_wait: 0, closed: 0 };
    for (const v of votes) {
      if (new Date(v.updated_at).getTime() > cutoff) map[v.status] += 1;
    }
    return map;
  }, [votes]);

  const myVote = useMemo(
    () => (user ? votes.find((v) => v.user_id === user.id)?.status ?? null : null),
    [votes, user],
  );

  // Hide the card when there's nothing to show and the organizer hasn't
  // activated either.
  if (!isActive && totalReports === 0 && !myVote) return null;

  const meta = headline ? STATUS_META[headline] : null;
  const total = Math.max(1, counts.walk_in + counts.short_wait + counts.long_wait + counts.closed);

  const handleVote = (s: LineStatus) => {
    if (!user) {
      toast({ title: "Sign in to report" });
      return;
    }
    haptic("medium");
    castVote.mutate(s, {
      onError: (e: any) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
    });
  };

  const handlePing = () => {
    haptic(pingArmed ? "light" : "success");
    setPingArmed((v) => !v);
    toast({
      title: pingArmed ? "Ping cancelled" : "We'll ping you 🔔",
      description: pingArmed ? undefined : "You'll get a nudge when the line clears.",
    });
  };

  return (
    <div className="tactile-widget p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="tactile-title">Line @ door</span>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {totalReports} report{totalReports === 1 ? "" : "s"}
        </p>
      </div>

      {/* Stacked distribution bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {ORDER.map((s) => {
          const pct = (counts[s] / total) * 100;
          if (pct === 0) return null;
          const isHead = headline === s;
          return (
            <div
              key={s}
              style={{
                width: `${pct}%`,
                backgroundColor: COLORS[s],
                boxShadow: isHead ? `0 0 16px ${COLORS[s]}` : undefined,
              }}
              className="h-full transition-all"
            />
          );
        })}
      </div>

      {/* Headline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {meta ? (
            <>
              <span
                className="h-2.5 w-2.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: COLORS[headline!] }}
              />
              <span className="text-base font-bold truncate" style={{ color: COLORS[headline!] }}>
                {headline === "long_wait" ? "Long right now" : meta.label}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No reports yet — be the first.</span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {derived ? "live · crowd-sourced" : organizerCurrent ? formatRelative(organizerCurrent.created_at) : ""}
        </span>
      </div>

      {/* Vote buttons */}
      <div className="grid grid-cols-4 gap-2">
        {ORDER.map((s) => {
          const active = myVote === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => handleVote(s)}
              disabled={castVote.isPending}
              aria-label={STATUS_META[s].label}
              className={`h-11 rounded-2xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "bg-foreground text-background scale-[1.02]"
                  : "bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[s], boxShadow: `0 0 8px ${COLORS[s]}` }}
              />
            </button>
          );
        })}
      </div>

      {/* Ping me */}
      <button
        type="button"
        onClick={handlePing}
        className={`w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          pingArmed
            ? "bg-primary/15 text-primary ring-1 ring-primary/40"
            : "bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        }`}
      >
        {castVote.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className={`h-4 w-4 ${pingArmed ? "fill-primary" : ""}`} />
        )}
        {pingArmed ? "We'll ping you" : "Ping me when it clears"}
      </button>
    </div>
  );
};

export default LineModeAttendeeView;
