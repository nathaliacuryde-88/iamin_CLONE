import { useMemo, useState, useCallback, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAccountMode } from "@/hooks/useAccountMode";
import { useEvents, useRsvpMutation } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import EventCard from "@/components/EventCard";
import WalletStack from "@/components/WalletStack";

import AddMoreEventsCTA from "@/components/AddMoreEventsCTA";

import EmptyFeedSuggestions from "@/components/EmptyFeedSuggestions";
import FilterSheet from "@/components/FilterSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { isPast, parseISO, endOfDay } from "date-fns";
import { FeedFilters, useFeedFilters } from "@/hooks/useFeedFilters";
import { useCityPulse } from "@/hooks/useCityPulse";
import { SlidersHorizontal, Dices } from "lucide-react";
import Roulette from "@/sheets/Roulette";
import { prefetchImages } from "@/lib/prefetchImages";
import GestureCoach, { shouldShowFeedCoach, markFeedCoachSeen } from "@/components/GestureCoach";

type FeedTab = "inner" | "pulse";

const Index = () => {
  const { mode, loading: modeLoading } = useAccountMode();
  if (!modeLoading && mode === "organizer") return <Navigate to="/organizer" replace />;
  return <PersonFeed />;
};

const PersonFeed = () => {
  const { data: events, isLoading, refetch } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const rsvp = useRsvpMutation();
  const { filters, activeCount, setShowFilters, setChromeHidden } = useFeedFilters();
  const haptic = useHaptics();
  const [tab, setTab] = useState<FeedTab>("inner");
  const [showCoach, setShowCoach] = useState(false);
  const [rouletteOpen, setRouletteOpen] = useState(false);

  useEffect(() => {
    if (shouldShowFeedCoach()) setShowCoach(true);
  }, []);

  // Safety: ensure top/bottom chrome is visible whenever the feed is on screen.
  // Prevents the Inner Circle / City Pulse strip from disappearing if a previous
  // route (event detail, gallery, filter sheet) left chromeHidden=true.
  useEffect(() => {
    setChromeHidden(false);
  }, [setChromeHidden]);

  // Feed page only: lock document scroll so just the WalletStack handles
  // gestures. We add a class instead of inlining body.style so we don't
  // fight Radix Sheets/Dialogs that toggle body styles on open/close.
  useEffect(() => {
    document.documentElement.classList.add("feed-locked");
    document.body.classList.add("feed-locked");
    return () => {
      document.documentElement.classList.remove("feed-locked");
      document.body.classList.remove("feed-locked");
    };
  }, []);



  

  const { data: followingIds = [] } = useQuery({
    queryKey: ["following-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      return (data ?? []).map((d) => d.following_id);
    },
    enabled: !!user,
  });

  // Events I've been directly invited to (list-privacy / ghost) — they
  // should always appear on my feed, even before I RSVP.
  const { data: invitedIds = [] } = useQuery({
    queryKey: ["my-invited-event-ids", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data } = await supabase
        .from("event_invites")
        .select("event_id")
        .eq("invitee_id", user.id);
      return (data ?? []).map((d: any) => d.event_id as string);
    },
    enabled: !!user,
  });


  const { data: pulseEvents, isLoading: pulseLoading } = useCityPulse();

  const filterAndSortEvents = useCallback((nextFilters: FeedFilters) => {
    if (!events) return [];
    const filtered = events.filter((e) => {
      // Ghost (tentative) and List (private) events are normally off the
      // main feed — but if I created them or I'm directly involved
      // (invited / RSVP'd), they belong on my feed.
      if (e.visibility === "private" || e.visibility === "tentative") {
        const mine = e.created_by === user?.id;
        const involved = e.attendees?.some((a: any) => a.user_id === user?.id);
        const invited = invitedIds.includes(e.id);
        if (!mine && !involved && !invited) return false;
      }

      if (e.date && isPast(endOfDay(parseISO(e.date)))) return false;


      // City filter — match against events.city (case-insensitive contains)
      if (nextFilters.city.trim()) {
        const city = (e as any).city as string | null | undefined;
        if (!city || !city.toLowerCase().includes(nextFilters.city.trim().toLowerCase())) return false;
      }

      if (nextFilters.vibes.length > 0) {
        const v = (e.vibe_category ?? "").trim().toLowerCase();
        if (!nextFilters.vibes.includes(v)) return false;
      }

      if (nextFilters.fromDate && e.date && e.date < nextFilters.fromDate) return false;
      if (nextFilters.toDate && e.date && e.date > nextFilters.toDate) return false;
      if (nextFilters.minFriends > 0) {
        const friendsGoing =
          e.attendees?.filter((a) => a.status === "going" && followingIds.includes(a.user_id)).length ?? 0;
        if (friendsGoing < nextFilters.minFriends) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const ad = a.date ?? "9999-12-31";
      const bd = b.date ?? "9999-12-31";
      if (ad !== bd) return ad < bd ? -1 : 1;
      const at = a.time ?? "99:99";
      const bt = b.time ?? "99:99";
      return at.localeCompare(bt);
    });
  }, [events, followingIds, invitedIds, user?.id]);

  const innerEvents = useMemo(() => filterAndSortEvents(filters), [filterAndSortEvents, filters]);

  // City Pulse stream — hooks return its own list; we still respect city/vibe filters lightly
  const visibleEvents = tab === "inner" ? innerEvents : (pulseEvents ?? []);
  // Warm the cache for the first few cover images so the very first scroll
  // feels instant. Runs on idle so it doesn't compete with initial paint.
  useEffect(() => {
    if (!visibleEvents || visibleEvents.length === 0) return;
    prefetchImages(visibleEvents.slice(0, 6).map((e: any) => e.image_url));
  }, [visibleEvents]);

  

  const handleInviteShare = async () => {
    const url = user ? `${window.location.origin}/profile/${user.id}` : window.location.origin;
    const text = "Come hang on I am in — track our plans, save events, see who's in. ✨";
    try {
      if (navigator.share) await navigator.share({ title: "I am in", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: "Link copied!" });
      }
    } catch { /* user cancelled */ }
  };

  const loading = tab === "inner" ? isLoading : pulseLoading;

  return (
    <AppLayout>
      {/* Feed column sized to the visible area below the top bar. A flex column
          (instead of a hard-coded dvh height on the inner scroller) lets the
          WalletStack fill exactly the leftover space, so cards never get
          clipped or pushed under the floating nav — the iOS standalone bug. */}
      <div
        className="max-w-lg mx-auto flex flex-col"
        style={{ height: "calc(100dvh - 3.5rem - env(safe-area-inset-top))" }}
      >
        {/* Tab strip — Inner Circle / City Pulse + Filter pill */}
        <div className="shrink-0 relative z-30 -mx-4 px-4 pt-3 pb-3">
          {/* Gradient mask sits BEHIND the tab labels so cards fade as they scroll under the strip */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+24px)]"
            style={{
              background:
                "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background)) 55%, hsl(var(--background) / 0) 100%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            {/* Left-aligned tab group */}
            <div className="flex items-center gap-5">
              {(["inner", "pulse"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { haptic("selection"); setTab(t); }}
                  className={`relative py-1 text-sm font-semibold tracking-tight transition-colors ${
                    tab === t ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t === "inner" ? "Inner Circle" : "City Pulse"}
                  {tab === t && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {/* Decision roulette dice */}
              <button
                type="button"
                onClick={() => { haptic("light"); setRouletteOpen(true); }}
                aria-label="Decision roulette"
                className="relative inline-flex items-center justify-center h-8 w-8 text-foreground/70 hover:text-foreground transition-colors"
              >
                <Dices className="h-4 w-4" />
              </button>
              {/* Filter — bare icon, no circular pill */}
              <button
                type="button"
                onClick={() => { haptic("light"); setShowFilters(true); }}
                aria-label="Filter"
                className="relative inline-flex items-center justify-center h-8 w-8 text-foreground/70 hover:text-foreground transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : visibleEvents && visibleEvents.length > 0 ? (
          <div className="h-full">
            <WalletStack
              cardHeight={440}
              gap={-32}
              onRefresh={() => refetch()}
              initialFocusIndex={(() => {
                if (typeof window === "undefined") return undefined;
                const lastId = window.sessionStorage.getItem("iamin.lastEventId");
                if (!lastId) return undefined;
                const idx = (visibleEvents as any[]).findIndex((e) => e.id === lastId);
                return idx >= 0 ? idx : undefined;
              })()}
              onFocusChange={(i) => {
                // Prefetch covers for the next/previous cards so they render
                // without a flash when the user advances.
                const neighbours = [
                  visibleEvents[i + 1],
                  visibleEvents[i + 2],
                  visibleEvents[i - 1],
                ].filter(Boolean) as any[];
                prefetchImages(neighbours.map((e) => e.image_url));
              }}
              onSwipe={(i, dir) => {
                const ev = visibleEvents[i];
                if (!ev || !user) return;
                const mine = (ev as any).attendees?.find((a: any) => a.user_id === user.id);
                const desired: "going" | "interested" = dir === "right" ? "going" : "interested";
                if (mine?.status === desired) return;
                rsvp.mutate({
                  kind: mine ? "update" : "insert",
                  eventId: ev.id,
                  status: desired,
                });
              }}
               /* footer removed for global fixed nav */ 
            >
              {[
                ...visibleEvents.map((event: any) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    allEvents={visibleEvents as any}
                    onStatusChange={refetch}
                    onDelete={refetch}
                  />
                )),
                ...(tab === "inner" ? [<AddMoreEventsCTA key="__cta__" />] : []),
              ]}
            </WalletStack>
          </div>
        ) : (
          tab === "inner" && activeCount > 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                <span className="text-2xl opacity-40">✦</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">No events match your filters</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Try clearing them</p>
            </div>
          ) : tab === "pulse" ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-sm font-medium">No trending events nearby</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Set your city in your profile to see more</p>
            </div>
          ) : (
            <EmptyFeedSuggestions />
          )
        )}
        </div>

        <FilterSheet liveCount={innerEvents.length} getLiveCount={(draft) => filterAndSortEvents(draft).length} />
        <Roulette open={rouletteOpen} onOpenChange={setRouletteOpen} />
      </div>
      {showCoach && (
        <GestureCoach onDone={() => { markFeedCoachSeen(); setShowCoach(false); }} />
      )}
    </AppLayout>
  );
};

export default Index;
