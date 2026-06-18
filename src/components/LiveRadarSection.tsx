import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { Radio, X, Map as MapIcon } from "lucide-react";
import { differenceInHours, parseISO } from "date-fns";
import { useLivePresence, useSetPresence, PresenceStatus } from "@/hooks/useLivePresence";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import LiveRadarMapSheet from "./LiveRadarMapSheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AttendeeProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface LiveRadarProps {
  eventId: string;
  eventDate: string | null;
  eventTime: string | null;
  attendees: AttendeeProfile[];
  isAttending: boolean;
  venueLat?: number | null;
  venueLng?: number | null;
  venueName?: string | null;
}

const PROMPT_KEY = (eid: string) => `iamin.radar.prompted.${eid}`;

const LiveRadarSection = ({
  eventId,
  eventDate,
  eventTime,
  attendees,
  isAttending,
  venueLat,
  venueLng,
  venueName,
}: LiveRadarProps) => {
  const { user } = useAuth();
  const haptic = useHaptics();
  const { toast } = useToast();
  const { data: presences = [] } = useLivePresence(eventId);
  const setPresence = useSetPresence();
  const [autoPrompted, setAutoPrompted] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [focusUserId, setFocusUserId] = useState<string | null>(null);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const myPresence = presences.find((p) => p.user_id === user?.id);

  const inWindow = useMemo(() => {
    if (!eventDate) return false;
    const start = parseISO(`${eventDate}T${eventTime ?? "00:00"}`);
    const hoursUntil = differenceInHours(start, new Date());
    return hoursUntil <= 2 && hoursUntil >= -12;
  }, [eventDate, eventTime]);

  useEffect(() => {
    if (!inWindow || !isAttending || autoPrompted) return;
    const flagged = window.localStorage.getItem(PROMPT_KEY(eventId));
    if (flagged) return;
    setAutoPrompted(true);
    window.localStorage.setItem(PROMPT_KEY(eventId), "1");
    toast({
      title: "Going to this soon? 📡",
      description: "Drop your pin so friends know you're en route.",
    });
  }, [inWindow, isAttending, autoPrompted, eventId, toast]);

  const stopWatching = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };
  useEffect(() => () => stopWatching(), []);

  const startSharing = (status: PresenceStatus) => {
    if (!navigator.geolocation) {
      setPresence.mutate({ eventId, status });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPresence.mutate({ eventId, status, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPresence.mutate({ eventId, status }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
    stopWatching();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setPresence.mutate({ eventId, status, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
  };

  if (!inWindow) return null;

  const broadcast = (status: PresenceStatus) => {
    haptic(status === "here" ? "success" : "light");
    if (status === "left") {
      stopWatching();
      setPresence.mutate({ eventId, status });
      return;
    }
    startSharing(status);
  };

  const profileFor = (uid: string) => attendees.find((a) => a.user_id === uid);
  const here = presences.filter((p) => p.status === "here");
  const onTheWay = presences.filter((p) => p.status === "on_the_way");

  // Distribute avatars deterministically around the radar.
  // Inner ring (here), outer ring (on the way). Angle from hashed user id.
  const RADIUS_INNER = 52;
  const RADIUS_OUTER = 96;
  const hashAngle = (uid: string) => {
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
    return (h % 360) * (Math.PI / 180);
  };
  const pinned = [
    ...here.map((p) => ({ p, radius: RADIUS_INNER })),
    ...onTheWay.map((p) => ({ p, radius: RADIUS_OUTER })),
  ];

  const myLabel = myPresence?.status === "here"
    ? "You're here — tap to update"
    : myPresence?.status === "on_the_way"
      ? "On the way — tap to update"
      : "Drop your pin — where are you?";

  const handleCenterAction = () => {
    if (!isAttending) {
      toast({ title: "RSVP first to drop a pin" });
      return;
    }
    setPinSheetOpen(true);
  };

  const choosePresence = (status: PresenceStatus) => {
    haptic(status === "here" ? "success" : "light");
    if (status === "left") {
      stopWatching();
      setPresence.mutate({ eventId, status });
    } else {
      startSharing(status);
    }
    setPinSheetOpen(false);
  };


  return (
    <div className="tactile-widget p-4 space-y-4">
      {/* Header — matches sibling cards (tactile-title) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <span className="tactile-title">Radar</span>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {here.length} there · {onTheWay.length} otw
        </p>
      </div>

      {/* Radar canvas */}
      <div
        className="relative mx-auto"
        style={{ width: 220, height: 220 }}
        aria-label="Live radar"
      >
        {/* Concentric rings — 3 evenly spaced, purple */}
        <svg
          viewBox="0 0 220 220"
          className="absolute inset-0 w-full h-full text-primary/25"
          aria-hidden
        >
          {[36, 72, 108].map((r) => (
            <circle key={r} cx="110" cy="110" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>

        {/* Purple sweep — always animating */}
        <div
          className="absolute inset-0 animate-radar-sweep pointer-events-none"
          aria-hidden
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.45) 35deg, transparent 70deg, transparent 360deg)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 0, black 108px, transparent 109px)",
            maskImage:
              "radial-gradient(circle at center, black 0, black 108px, transparent 109px)",
          }}
        />

        {/* Center pin — no circle background */}
        <button
          type="button"
          onClick={handleCenterAction}
          aria-label={myLabel}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <span className="text-2xl leading-none drop-shadow-lg">📍</span>
        </button>

        {/* Attendee avatars — no colored ring */}
        {pinned.map(({ p, radius }) => {
          const ang = hashAngle(p.user_id);
          const cx = 110 + Math.cos(ang) * radius;
          const cy = 110 + Math.sin(ang) * radius;
          const prof = profileFor(p.user_id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (typeof p.lat === "number" && typeof p.lng === "number") {
                  setFocusUserId(p.user_id);
                  setMapOpen(true);
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full overflow-hidden hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-fade-in"
              style={{ left: cx, top: cy }}
              title={prof?.display_name ?? "Someone"}
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={prof?.avatar_url ?? undefined} />
                <AvatarFallback {...avatarFallbackProps(prof?.display_name ?? p.user_id)} className="text-xs">
                  {prof?.display_name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          );
        })}

        {/* Stop-sharing X — overlay on center pin when I'm broadcasting */}
        {myPresence && (
          <button
            type="button"
            onClick={() => broadcast("left")}
            aria-label="Stop sharing"
            className="absolute top-1/2 left-1/2 translate-x-3 -translate-y-8 h-5 w-5 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive flex items-center justify-center text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* CTA pill */}
      <button
        type="button"
        onClick={handleCenterAction}
        className="w-full rounded-2xl card-surface px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {myLabel}
      </button>

      {(here.length + onTheWay.length > 0 || (venueLat && venueLng)) && (
        <button
          type="button"
          onClick={() => { setFocusUserId(null); setMapOpen(true); }}
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md py-1"
        >
          <MapIcon className="h-3.5 w-3.5" /> Open full map
        </button>
      )}

      <LiveRadarMapSheet
        open={mapOpen}
        onOpenChange={setMapOpen}
        presences={presences}
        attendees={attendees}
        venue={{ lat: venueLat ?? null, lng: venueLng ?? null, name: venueName }}
        focusUserId={focusUserId}
      />

      {/* Where are you? — bottom sheet */}
      <Sheet open={pinSheetOpen} onOpenChange={setPinSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-center">Where are you?</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {([
              { s: "here" as const, emoji: "🎉", label: "I'm there", desc: "Shows on the inner ring" },
              { s: "on_the_way" as const, emoji: "🛵", label: "On the way", desc: "ETA vibes for the group" },
              { s: "left" as const, emoji: "🛋️", label: "Still home", desc: "Honesty is hot" },
            ]).map(({ s, emoji, label, desc }) => {
              const active =
                (s === "here" && myPresence?.status === "here") ||
                (s === "on_the_way" && myPresence?.status === "on_the_way") ||
                (s === "left" && !myPresence);
              return (
                <button
                  key={s}
                  onClick={() => choosePresence(s)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors ${
                    active ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary/40 hover:bg-secondary/60"
                  }`}
                >
                  <span className="text-3xl leading-none">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LiveRadarSection;
