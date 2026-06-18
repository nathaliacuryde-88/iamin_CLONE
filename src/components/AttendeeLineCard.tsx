import { Card, CardContent } from "@/components/ui/card";
import { formatRelative, STATUS_META, type LineStatus } from "@/hooks/useLineMode";
import { useCastLineVote, useLineVotes } from "@/hooks/useLineVotes";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const VOTE_OPTIONS: LineStatus[] = ["walk_in", "short_wait", "long_wait", "closed"];

interface Props {
  eventId: string;
  eventDate: string | null | undefined;
  eventEndDate?: string | null | undefined;
  eventTime?: string | null | undefined;
  vibeCategory?: string | null | undefined;
  isAttendee: boolean;
  eligible?: boolean;
}

/**
 * The line is "open" from the event's start (date+time) through its
 * effective end. If an end_date is set, we use it. Otherwise we apply a
 * vibe-aware heuristic so nightlife events stay open until the next
 * morning (6am local) without the organizer having to configure
 * anything.
 */
const NIGHTLIFE_VIBES = new Set(["party", "festival", "club", "concert", "nightlife", "music"]);

const computeWindow = (
  start: string | null | undefined,
  end: string | null | undefined,
  time: string | null | undefined,
  vibe: string | null | undefined,
): { openAt: Date | null; closeAt: Date | null } => {
  if (!start) return { openAt: null, closeAt: null };
  const startISO = `${start}T${time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : "00:00"}:00`;
  const openAt = new Date(startISO);
  if (Number.isNaN(openAt.getTime())) return { openAt: null, closeAt: null };

  let closeAt: Date;
  if (end) {
    // End of the last day at 23:59
    closeAt = new Date(`${end}T23:59:00`);
  } else if (vibe && NIGHTLIFE_VIBES.has(vibe.toLowerCase())) {
    // Nightlife → next morning 06:00 local
    closeAt = new Date(openAt);
    closeAt.setDate(closeAt.getDate() + 1);
    closeAt.setHours(6, 0, 0, 0);
  } else {
    // Default → start + 4h
    closeAt = new Date(openAt.getTime() + 4 * 60 * 60 * 1000);
  }
  return { openAt, closeAt };
};

/**
 * Attendee-driven Line card — visible on every open event during its
 * active window. Anyone attending can post their current view of the
 * door; the displayed status is the mode of the last 30 minutes of votes.
 */
export default function AttendeeLineCard({ eventId, eventDate, eventEndDate, eventTime, vibeCategory, isAttendee, eligible = true }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { votes, derived } = useLineVotes(eligible ? eventId : undefined);
  const cast = useCastLineVote(eventId);
  const myVote = user ? votes.find((v) => v.user_id === user.id) : null;
  const { openAt, closeAt } = computeWindow(eventDate, eventEndDate, eventTime, vibeCategory);
  const now = new Date();
  const open = !!openAt && !!closeAt && now >= openAt && now <= closeAt;

  if (!eligible || !open) {
    return null;
  }

  const meta = derived ? STATUS_META[derived.status] : null;

  const handleVote = (s: LineStatus) => {
    if (!isAttendee) {
      toast({
        title: "RSVP first",
        description: "Mark yourself going to help report the line.",
      });
      return;
    }
    cast.mutate(s, {
      onError: (e: any) => toast({ title: "Couldn't post", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Card className="tactile-widget">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Line tonight · attendees</p>
            {meta ? (
              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${meta.pill}`}>
                <span className={`h-2 w-2 rounded-full ${meta.dot} ${derived!.status !== "closed" ? "animate-pulse" : ""}`} />
                <span className="text-sm font-bold">{meta.label}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No one's checked in yet — be the first.</p>
            )}
            {derived && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {derived.count}/{derived.total} of last 30 min · updated {formatRelative(derived.updated_at)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {VOTE_OPTIONS.map((s) => {
            const m = STATUS_META[s];
            const mine = myVote?.status === s;
            return (
              <button
                key={s}
                onClick={() => handleVote(s)}
                disabled={cast.isPending}
                aria-pressed={mine}
                className={`rounded-lg border p-2 transition-all ${m.tint} ${
                  mine ? `${m.border} ring-1` : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${m.dot} ${s !== "closed" ? "animate-pulse" : ""}`} />
                  <span className="text-[9px] font-semibold truncate">{m.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {!isAttendee && (
          <p className="text-[10px] text-muted-foreground text-center">
            Only attendees can post the line status.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
