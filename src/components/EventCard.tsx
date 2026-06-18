import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { emojiFallbackProps } from "@/lib/avatarEmoji";
import { HelpCircle, Check, MapPin, EyeOff, Lock, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendIds } from "@/hooks/useFriendIds";
import { useRsvpMutation } from "@/hooks/useEvents";
import { useEventReactions, useToggleReaction } from "@/hooks/useEventReactions";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { Tables } from "@/integrations/supabase/types";
import { parseISO, isPast, endOfDay, isToday, isTomorrow } from "date-fns";
import { format } from "@/lib/dateFormat";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "@/lib/dateLocale";
import { toSentenceCase } from "@/lib/utils";
import TabPill from "@/components/TabPill";
import ReactionPicker from "@/components/ReactionPicker";
import EmojiBurst from "@/components/EmojiBurst";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LineStatusBadge from "@/components/LineStatusBadge";
import BlurImage from "@/components/BlurImage";

type EventWithAttendees = Tables<"events"> & {
  attendees?: (Tables<"attendees"> & { profile?: Tables<"profiles"> | null })[];
  creator_profile?: Tables<"profiles"> | null;
  cover_emoji?: string | null;
  cover_color?: string | null;
};

const vibeLabels: Record<string, { label: string; emoji: string }> = {
  music: { label: "Music", emoji: "🎵" },
  party: { label: "Party", emoji: "🎉" },
  festival: { label: "Festival", emoji: "🎪" },
  birthday: { label: "Birthday", emoji: "🎂" },
  art: { label: "Art", emoji: "🎨" },
  food: { label: "Food", emoji: "🍽️" },
  brunch: { label: "Brunch", emoji: "🥂" },
  cinema: { label: "Cinema", emoji: "🎬" },
  sports: { label: "Sports", emoji: "⚡" },
  "street markets": { label: "Street Markets", emoji: "🛍️" },
};

// Resolve any non-empty vibe_category into a chip — known keys get their
// emoji + canonical label, custom-typed values keep their casing with a
// fallback emoji so user-defined tags still render.
const resolveVibe = (raw: string | null | undefined) => {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if (vibeLabels[key]) return vibeLabels[key];
  return {
    label: raw.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
    emoji: "✦",
  };
};

const parseCoverMeta = (description: string | null) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};
const stripMeta = (s: string | null) => (s ?? "").replace(/\[\[cover:[^\]]+\]\]\s*/g, "").trim();

const EventCard = ({
  event,
  allEvents,
  onStatusChange,
  onDelete,
  showDelete = false,
}: {
  event: EventWithAttendees;
  allEvents?: EventWithAttendees[];
  onStatusChange?: () => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: friendIds = [] } = useFriendIds();
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptic = useHaptics();
  const rsvp = useRsvpMutation();
  const [flicker, setFlicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Long-press → emoji reactions (E2)
  const { data: reactions = [] } = useEventReactions(event.id);
  const toggleReaction = useToggleReaction();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<{ x: number; y: number } | null>(null);
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);
  const [burstRect, setBurstRect] = useState<DOMRect | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressedRef = useRef(false);

  // My current reaction (if any) — shown as the bottom-right corner pill on the image.
  const myReaction = reactions.find((r) => r.user_id === user?.id)?.emoji ?? null;
  // Count for that emoji across all reactions.
  const myReactionCount = myReaction
    ? reactions.filter((r) => r.emoji === myReaction).length
    : 0;

  const cardRef = useRef<HTMLDivElement>(null);

  const startLongPress = (_e: React.PointerEvent) => {
    longPressedRef.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressedRef.current = true;
      haptic("medium");
      const rect = cardRef.current?.getBoundingClientRect();
      // Anchor at the LEFT edge of the card, vertically centered. The picker
      // renders left-aligned from this point so it never gets cropped.
      setPickerAnchor({
        x: rect ? rect.left + 12 : 16,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      });
      setPickerOpen(true);
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const myAttendance = event.attendees?.find((a) => a.user_id === user?.id);
  const goingUsers = event.attendees?.filter((a) => a.status === "going") ?? [];
  const interestedUsers = event.attendees?.filter((a) => a.status === "interested") ?? [];

  // Tab total (shown as a pill if any expenses exist)
  const { data: tabData } = useQuery({
    queryKey: ["event-tab-total", event.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_expenses")
        .select("amount_cents,currency")
        .eq("event_id", event.id);
      const total = (data ?? []).reduce((s, e) => s + e.amount_cents, 0);
      return { total, currency: data?.[0]?.currency ?? "EUR" };
    },
  });

  const eventPassed = event.date ? isPast(endOfDay(parseISO(event.date))) : false;
  const isGhost = event.visibility === "tentative";
  const isPrivate = event.visibility === "private";
  const isOwner = event.created_by === user?.id;
  const ghostRestricted = isGhost && !isOwner;

  const vibe = resolveVibe(event.vibe_category);
  const displayName = toSentenceCase(event.name);
  const coverMeta = parseCoverMeta(event.description);
  const description = stripMeta(event.description);

  const duplicateCount =
    allEvents?.filter(
      (e) =>
        e.id !== event.id &&
        e.name.trim().toLowerCase() === event.name.trim().toLowerCase() &&
        e.date === event.date &&
        friendIds.includes(e.created_by)
    ).length ?? 0;

  const handleStatus = (status: "interested" | "going", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    // Fire haptic before network so it feels instant
    if (myAttendance?.status === status) {
      haptic("selection");
      rsvp.mutate({ kind: "delete", eventId: event.id });
    } else if (myAttendance) {
      if (status === "going") {
        haptic("success");
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 500);
      } else {
        haptic("light");
      }
      rsvp.mutate({ kind: "update", eventId: event.id, status });
    } else {
      if (status === "going") {
        haptic("success");
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 500);
      } else {
        haptic("light");
      }
      rsvp.mutate({ kind: "insert", eventId: event.id, status });
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      onDelete?.(event.id);
    }
    setConfirmDelete(false);
  };

  const handleCardClick = () => {
    // Suppress click if a long-press just fired the reaction picker.
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (ghostRestricted) {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 500);
      return;
    }
    navigate(`/event/${event.id}`);
  };

  const endDate = (event as any).end_date as string | null | undefined;
  const startTime = (event as any).time as string | null | undefined;
  const endTime = (event as any).end_time as string | null | undefined;
  // Live = now between start and end (end fallback = +4h after start, or end of date)
  const isLive = (() => {
    if (!event.date) return false;
    const startStr = `${event.date}T${(startTime ?? "00:00").slice(0, 5)}:00`;
    const start = new Date(startStr).getTime();
    const endDateStr = endDate ?? event.date;
    const endStr = endTime
      ? `${endDateStr}T${endTime.slice(0, 5)}:00`
      : `${endDateStr}T${(startTime ?? "00:00").slice(0, 5)}:00`;
    let end = new Date(endStr).getTime();
    if (!endTime) end += 4 * 60 * 60 * 1000;
    const now = Date.now();
    return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end;
  })();
  const formattedDate = event.date
    ? endDate && endDate !== event.date
      ? `${format(parseISO(event.date), "MMM d", { locale: dateLocale })} — ${format(parseISO(endDate), "MMM d", { locale: dateLocale })}`
      : isToday(parseISO(event.date))
        ? t("common.today")
        : isTomorrow(parseISO(event.date))
          ? t("common.tomorrow")
          : format(parseISO(event.date), "EEE, MMM d", { locale: dateLocale })
    : null;
  const attendeeCount = goingUsers.length + interestedUsers.length;
  const reactionBadge = myReaction && !ghostRestricted ? (
    <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-background/75 backdrop-blur-md border border-border/70 shadow-md pointer-events-none">
      <span className="text-base leading-none">{myReaction}</span>
      {myReactionCount > 1 && (
        <span className="text-[10px] font-bold text-foreground/85 leading-none">{myReactionCount}</span>
      )}
    </div>
  ) : null;

  return (
    <>
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      className={`group h-full cursor-pointer ${isCelebrating ? "animate-card-jump" : ""} ${eventPassed ? "opacity-70" : ""} ${flicker ? "animate-shake" : ""}`}
    >
      <div className={`h-full rounded-2xl overflow-hidden transition-all duration-300 card-surface hover:border-primary/30 relative ${isGhost ? "ring-1 ring-primary/30" : ""} ${isLive ? "ring-1 ring-primary/60" : ""}`}>
        {/* Reaction summary moved to a bottom-right pill on the image (see below). */}
        {/* duplicate-friend tag removed per design */}

        {/* Owner trash icon — only on own profile, not feed */}
        {showDelete && isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); haptic("warning"); setConfirmDelete(true); }}
            className="absolute top-3 right-3 z-30 h-7 w-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-background transition-colors border border-border/40"
            title="Delete event"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="flex items-center justify-between px-5 py-4 gap-3">
          <div className="min-w-0 flex-1">
            {ghostRestricted ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="text-foreground font-medium">{event.creator_profile?.display_name ?? "Someone"}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider">
                  <EyeOff className="h-2.5 w-2.5" /> {t("events.ghost_event")}
                </span>
              </p>
            ) : (
              <h3 className="font-semibold text-foreground text-[15px] tracking-tight truncate">{displayName}</h3>
            )}
          </div>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Live
            </span>
          ) : formattedDate && (
            <span className="text-sm text-muted-foreground font-medium tracking-wide shrink-0">
              {formattedDate}
            </span>
          )}
        </div>

        <div className={`relative ${ghostRestricted ? "blur-md select-none pointer-events-none" : ""}`}>
          {/* Live Line Mode status — only renders when the organizer has it active */}
          <div className="absolute top-5 right-5 z-30 pointer-events-auto flex flex-col items-end gap-1.5">
            <LineStatusBadge eventId={event.id} eligible={event.visibility === "public" && event.creator_profile?.account_type === "organizer"} />
          </div>

          {event.image_url ? (
            <div className="relative mx-3 mb-3 rounded-xl overflow-hidden h-[320px] md:h-[280px]">
              {reactionBadge}
              {isOwner && (isGhost || isPrivate) && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md">
                  {isPrivate ? <Lock className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="text-[9px] font-bold tracking-wider uppercase">{isPrivate ? t("events.private") : t("events.ghost")}</span>
                </div>
              )}
              <BlurImage
                src={event.image_url}
                alt={displayName}
                priority
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />

              {eventPassed && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{t("events.time_capsule")}</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                {event.location && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md w-fit">
                    <MapPin className="h-3 w-3 text-white/70" />
                    <span className="text-[11px] text-white/80 font-medium truncate max-w-[160px]">{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          ) : coverMeta ? (
            <div
              className="relative mx-3 mb-3 rounded-xl h-[320px] md:h-[280px] flex items-center justify-center overflow-hidden"
              style={{ background: `hsl(${coverMeta.color})` }}
            >
              {reactionBadge}
              {isOwner && (isGhost || isPrivate) && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md">
                  {isPrivate ? <Lock className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="text-[9px] font-bold tracking-wider uppercase">{isPrivate ? t("events.private") : t("events.ghost")}</span>
                </div>
              )}
              <span className="text-7xl drop-shadow-md">{coverMeta.emoji}</span>
              <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                {event.location && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md w-fit">
                    <MapPin className="h-3 w-3 text-white/70" />
                    <span className="text-[11px] text-white/80 font-medium truncate max-w-[160px]">{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-3 mb-3 rounded-xl h-[320px] md:h-[280px] bg-gradient-to-br from-primary/15 via-primary/5 to-primary/15 flex items-center justify-center relative overflow-hidden">
              {reactionBadge}
              {isOwner && (isGhost || isPrivate) && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md">
                  {isPrivate ? <Lock className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="text-[9px] font-bold tracking-wider uppercase">{isPrivate ? t("events.private") : t("events.ghost")}</span>
                </div>
              )}
              <span className="text-5xl opacity-40">{vibe?.emoji ?? "✦"}</span>
              {event.location && (
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md w-fit">
                    <MapPin className="h-3 w-3 text-white/70" />
                    <span className="text-[11px] text-white/80 font-medium truncate max-w-[160px]">{event.location}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-5 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {(() => {
                const goingCount = goingUsers.length;
                // Prioritize friend avatars first, then anyone else.
                const ordered = [
                  ...goingUsers.filter((a) => friendIds.includes(a.user_id)),
                  ...goingUsers.filter((a) => !friendIds.includes(a.user_id)),
                  ...interestedUsers.filter((a) => friendIds.includes(a.user_id)),
                  ...interestedUsers.filter((a) => !friendIds.includes(a.user_id)),
                ];
                const shown = ordered.slice(0, 3);
                const remainingGoing = Math.max(0, goingCount - shown.length);
                if (attendeeCount === 0) {
                  return <span className="text-xs text-muted-foreground/60">{t("events.be_the_first")}</span>;
                }
                return (
                  <>
                    <div className="flex -space-x-1.5">
                      {shown.map((a) => (
                        <Avatar
                          key={a.id}
                          className={`h-6 w-6 border-2 border-background ring-1 ${
                            friendIds.includes(a.user_id) ? "ring-primary/50" : "ring-border"
                          }`}
                        >
                          <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]" {...emojiFallbackProps(a.profile?.username ?? a.profile?.display_name ?? a.user_id)} />

                        </Avatar>
                      ))}
                      {remainingGoing > 0 && (
                        <div className="h-6 min-w-6 px-1.5 rounded-full border-2 border-background bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold">
                          +{remainingGoing}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{attendeeCount}</span>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => { e.stopPropagation(); cancelLongPress(); }}>
              <button
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  myAttendance?.status === "interested"
                    ? "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30"
                    : "bg-secondary text-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                }`}
                onClick={(e) => handleStatus("interested", e)}
              >
                <HelpCircle className="h-3 w-3" />
                <span>{t("events.maybe")}</span>
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  myAttendance?.status === "going"
                    ? "bg-primary text-primary-foreground border border-primary glow-sm"
                    : "bg-secondary text-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                }`}
                onClick={(e) => handleStatus("going", e)}
              >
                <Check className="h-3 w-3" />
                <span>{t("events.going")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("events.delete_event_title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("events.delete_event_desc", { name: displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <ReactionPicker
      open={pickerOpen}
      anchor={pickerAnchor}
      onClose={() => setPickerOpen(false)}
      onPick={(emoji) => {
        // Capture the card rect now so the burst rises from where the user
        // was holding even if the card scrolls afterward.
        setBurstRect(cardRef.current?.getBoundingClientRect() ?? null);
        setBurstEmoji(emoji);
        toggleReaction.mutate({ eventId: event.id, emoji });
        setPickerOpen(false);
      }}
    />
    <EmojiBurst emoji={burstEmoji} rect={burstRect} onDone={() => { setBurstEmoji(null); setBurstRect(null); }} />
    </>
  );
};

export default EventCard;
