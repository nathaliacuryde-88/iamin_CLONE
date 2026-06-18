import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { motion, PanInfo } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { parseISO, isSameDay, addDays, isToday, endOfDay, isPast, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, eachDayOfInterval, isSameMonth, addWeeks, isWithinInterval, startOfDay, differenceInCalendarDays,  } from "date-fns";
import { format } from "@/lib/dateFormat";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { ChevronLeft, ChevronRight, Lock, CheckCircle2, Plus, PartyPopper, Ban, X, Check, Clock, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SegmentedControl from "@/components/SegmentedControl";
import { useAvailabilityBlocks, datesInRange } from "@/hooks/useAvailabilityBlocks";
import BlockRangeSheet from "@/components/BlockRangeSheet";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { toSentenceCase } from "@/lib/utils";
import { useFriendBirthdays, birthdayKey } from "@/hooks/useFriendBirthdays";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import BirthdayCardComposer from "@/components/BirthdayCardComposer";

const parseCoverMetaSmall = (description: string | null | undefined) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};

type ViewMode = "month" | "week" | "day";

const emptyDayCopy = [
  "This day is suspiciously quiet... let's ruin the peace and quiet 👀",
  "Empty calendar = wasted potential. Fix it.",
  "Your future self called — they want plans.",
  "Nothing here. Yet. The night is young.",
  "Your social life is buffering... add an event.",
];

type SheetMode =
  | { kind: "confirm-new"; start: Date; end: Date }
  | { kind: "edit-existing"; rangeDates: string[]; reason?: string | null }
  | { kind: "confirm-replace"; oldDates: string[]; start: Date; end: Date }
  | null;

const CalendarView = () => {
  const { t, i18n: _i18n } = useTranslation();
  const { data: allEvents, refetch: refetchEvents } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const haptic = useHaptics();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showMaybes, setShowMaybes] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem("calendar:showMaybes");
    return v === null ? true : v === "true";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("calendar:showMaybes", String(showMaybes));
    }
  }, [showMaybes]);

  const { blockedSet, reasonByDate, addRange, removeRange, replaceRange, updateReason, findContiguousRange } = useAvailabilityBlocks();

  // Range-select state machine
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingOldDates, setEditingOldDates] = useState<string[] | null>(null);
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [cardTarget, setCardTarget] = useState<{ friend: { user_id: string; display_name: string | null; avatar_url: string | null }; birthdayDate: string } | null>(null);

  const longPressTimer = useRef<number | null>(null);
  const pressedDay = useRef<Date | null>(null);
  const movedDuringPress = useRef(false);
  const lastHoverUpdate = useRef<number>(0);
  const lastHoverDayKey = useRef<string | null>(null);
  const [pressingDay, setPressingDay] = useState<Date | null>(null);

  // Calendar only shows events the user actively opted into ("going" or
  // "interested"). Events the user created but never RSVP'd to are NOT
  // automatically added — they still live on the organizer dashboard / Profile.
  const events = useMemo(() => {
    if (!allEvents || !user) return [];
    return allEvents.filter(
      (e) =>
        e.attendees?.some(
          (a) => a.user_id === user.id && (a.status === "going" || a.status === "interested"),
        ),
    );
  }, [allEvents, user]);

  // Friend birthdays — show as little 🎂 markers on the calendar
  const { data: friendBirthdays = [] } = useFriendBirthdays();
  const birthdaysByMmDd = useMemo(() => {
    const map = new Map<string, typeof friendBirthdays>();
    for (const b of friendBirthdays) {
      const k = birthdayKey(b.birthday);
      const arr = map.get(k) ?? [];
      arr.push(b);
      map.set(k, arr);
    }
    return map;
  }, [friendBirthdays]);
  const birthdaysOnDay = useCallback(
    (day: Date) => birthdaysByMmDd.get(format(day, "MM-dd")) ?? [],
    [birthdaysByMmDd]
  );

  const isBlocked = (day: Date) => blockedSet.has(format(day, "yyyy-MM-dd"));

  const eventsOnDay = (day: Date) =>
    events?.filter((e) => {
      if (!e.date) return false;
      const start = parseISO(e.date);
      const endStr = (e as any).end_date as string | null | undefined;
      const end = endStr ? parseISO(endStr) : start;
      return isWithinInterval(day, { start: startOfDay(start), end: endOfDay(end) });
    }) ?? [];

  const dotSize = (day: Date) => {
    const n = eventsOnDay(day).length;
    if (n === 0) return 0;
    // Single events always render the same size; multi-event days grow up to a cap.
    if (n === 1) return 6;
    return Math.min(6 + (n - 1) * 2, 12);
  };

  const navigatePeriod = (dir: number) => {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, dir));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, dir));
    else setCurrentDate((d) => addDays(d, dir));
    setSelectedDay(null);
  };

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: ws, end: addDays(ws, 6) });
  }, [currentDate]);

  const displayDays = viewMode === "month" ? monthDays : viewMode === "week" ? weekDays : [startOfDay(currentDate)];

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const dated = events.filter((e) => e.date);

    const overlaps = (e: typeof dated[number], rangeStart: Date, rangeEnd: Date) => {
      const s = parseISO(e.date!);
      const endStr = (e as any).end_date as string | null | undefined;
      const en = endStr ? parseISO(endStr) : s;
      return s <= endOfDay(rangeEnd) && en >= startOfDay(rangeStart);
    };

    // Sort: upcoming events first (date asc), past events at the bottom (most-recent past first).
    const todayStart = startOfDay(new Date());
    const isPastEv = (e: typeof dated[number]) => {
      const endStr = (e as any).end_date as string | null | undefined;
      const ref = endStr ? parseISO(endStr) : parseISO(e.date!);
      return endOfDay(ref) < todayStart;
    };
    const byDateTime = (a: typeof dated[number], b: typeof dated[number]) => {
      const aPast = isPastEv(a);
      const bPast = isPastEv(b);
      if (aPast !== bPast) return aPast ? 1 : -1; // past goes after upcoming
      const dateDiff = parseISO(a.date!).getTime() - parseISO(b.date!).getTime();
      // For past events, show most recent first (descending); upcoming ascending.
      if (dateDiff !== 0) return aPast ? -dateDiff : dateDiff;
      const at = a.time ?? "99:99";
      const bt = b.time ?? "99:99";
      return at.localeCompare(bt);
    };

    let scoped: typeof dated = [];
    if (selectedDay) {
      scoped = dated.filter((e) => overlaps(e, selectedDay, selectedDay));
    } else if (viewMode === "day") {
      scoped = dated.filter((e) => overlaps(e, currentDate, currentDate));
    } else if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      scoped = dated.filter((e) => overlaps(e, ws, we));
    } else {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      scoped = dated.filter((e) => overlaps(e, ms, me));
    }

    return scoped.sort(byDateTime);
  }, [events, selectedDay, viewMode, currentDate]);

  // Helper: a "maybe" event = the user RSVP'd interested AND isn't the creator.
  // A "maybe" event = the user explicitly RSVP'd "interested". Owners who
  // mark themselves as Maybe also count, so the toggle hides them too.
  const isMaybeForMe = useCallback((ev: any) => {
    if (!user) return false;
    const mine = ev.attendees?.find((a: any) => a.user_id === user.id);
    return mine?.status === "interested";
  }, [user]);

  const hasAnyMaybe = useMemo(() => filteredEvents.some(isMaybeForMe), [filteredEvents, isMaybeForMe]);
  const visibleFilteredEvents = useMemo(
    () => (showMaybes ? filteredEvents : filteredEvents.filter((e) => !isMaybeForMe(e))),
    [filteredEvents, showMaybes, isMaybeForMe],
  );

  const isPastDate = (dateStr: string) => isPast(endOfDay(parseISO(dateStr)));

  const birthdayItemsForScope = useMemo(() => {
    let start: Date, end: Date;
    if (selectedDay) { start = startOfDay(selectedDay); end = endOfDay(selectedDay); }
    else if (viewMode === "day") { start = startOfDay(currentDate); end = endOfDay(currentDate); }
    else if (viewMode === "week") { start = startOfWeek(currentDate, { weekStartsOn: 1 }); end = endOfWeek(currentDate, { weekStartsOn: 1 }); }
    else { start = startOfMonth(currentDate); end = endOfMonth(currentDate); }
    const todayStart = startOfDay(new Date());
    return eachDayOfInterval({ start, end }).flatMap((day) =>
      birthdaysOnDay(day).map((person) => ({
        kind: "birthday" as const,
        id: `birthday-${person.user_id}-${format(day, "yyyy-MM-dd")}`,
        day,
        person,
        isPast: day < todayStart,
      })),
    );
  }, [birthdaysOnDay, currentDate, selectedDay, viewMode]);

  const calendarListItems = useMemo(() => {
    const eventItems = visibleFilteredEvents.map((event) => {
      const endDate = (event as any).end_date as string | null | undefined;
      const dateStr = endDate ?? event.date;
      const day = dateStr ? parseISO(dateStr) : new Date(8640000000000000);
      return { kind: "event" as const, id: event.id, event, day, isPast: event.date ? isPastDate(dateStr!) : false };
    });
    return [...eventItems, ...birthdayItemsForScope].sort((a, b) => {
      if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
      const diff = a.day.getTime() - b.day.getTime();
      if (diff !== 0) return diff;
      if (a.kind !== b.kind) return a.kind === "birthday" ? 1 : -1;
      return a.id.localeCompare(b.id);
    });
  }, [birthdayItemsForScope, visibleFilteredEvents]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Empty CTA fires when:
  //  - the user picked a specific day in month/week and it has no events, OR
  //  - the user is in day view and the current day has no events
  const showEmptyCTA =
    (selectedDay && calendarListItems.length === 0 && !isBlocked(selectedDay)) ||
    (viewMode === "day" && calendarListItems.length === 0 && !isBlocked(currentDate));
  const emptyCopyDay = selectedDay ?? (viewMode === "day" ? currentDate : null);
  const emptyCopy = useMemo(() => {
    if (!emptyCopyDay) return "";
    return emptyDayCopy[emptyCopyDay.getDate() % emptyDayCopy.length];
  }, [emptyCopyDay]);

  // ---- Range-select interaction ----

  const inRangeSelectMode = anchor !== null;

  const previewRangeSet = useMemo(() => {
    if (!anchor) return new Set<string>();
    const end = hoverDay ?? anchor;
    return new Set(datesInRange(anchor, end));
  }, [anchor, hoverDay]);

  const findDayFromElement = (el: Element | null): Date | null => {
    let cur: Element | null = el;
    while (cur) {
      const ds = (cur as HTMLElement).dataset?.date;
      if (ds) return parseISO(ds);
      cur = cur.parentElement;
    }
    return null;
  };

  const exitRangeMode = useCallback(() => {
    setAnchor(null);
    setHoverDay(null);
    setIsDragging(false);
    setEditingOldDates(null);
  }, []);

  const startRangeMode = (day: Date) => {
    setAnchor(day);
    setHoverDay(day);
    setIsDragging(true);
    lastHoverDayKey.current = format(day, "yyyy-MM-dd");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.([20, 40, 25]); } catch { /* ignore */ }
    }
  };

  // Global pointermove + pointerup once dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      // Throttle hover updates to ~60ms for a deliberate cadence
      if (now - lastHoverUpdate.current < 60) return;
      lastHoverUpdate.current = now;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const day = findDayFromElement(el);
      if (day) {
        const key = format(day, "yyyy-MM-dd");
        if (key !== lastHoverDayKey.current) {
          lastHoverDayKey.current = key;
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try { (navigator as any).vibrate?.(8); } catch { /* ignore */ }
          }
        }
        setHoverDay(day);
      }
    };
    const onUp = () => {
      setIsDragging(false);
      // anchor + hoverDay still set — user can tap end-day instead
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging]);

  // NOTE: We deliberately do NOT auto-open the confirm sheet on pointerup.
  // After long-press fires, the user stays in range-select mode and can keep
  // adjusting the end day (by dragging or tapping). They commit explicitly via
  // the "Done" button in the hint banner. This prevents the sheet from popping
  // up mid-drag.

  const openConfirmSheet = () => {
    if (!anchor) return;
    const end = hoverDay ?? anchor;
    if (editingOldDates) {
      setSheet({ kind: "confirm-replace", oldDates: editingOldDates, start: anchor, end });
    } else {
      setSheet({ kind: "confirm-new", start: anchor, end });
    }
  };

  const handlePointerDown = (day: Date, e: React.PointerEvent) => {
    pressedDay.current = day;
    movedDuringPress.current = false;

    // If already in range mode, this tap chooses end day (no auto-commit)
    if (anchor) {
      setHoverDay(day);
      setIsDragging(false);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(8); } catch { /* ignore */ }
      }
      return;
    }

    // Tap on blocked day → open edit sheet
    if (isBlocked(day)) {
      const range = findContiguousRange(format(day, "yyyy-MM-dd"));
      const reason = range.length > 0 ? reasonByDate.get(range[0]) ?? null : null;
      setSheet({ kind: "edit-existing", rangeDates: range, reason });
      return;
    }

    // Otherwise: start long-press timer (slower, more deliberate)
    setPressingDay(day);
    longPressTimer.current = window.setTimeout(() => {
      startRangeMode(day);
      setPressingDay(null);
      movedDuringPress.current = true;
    }, 650);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current && pressedDay.current) {
      // If finger moves significantly before long-press fires, cancel timer (treat as scroll)
      // We rely on the global handler once dragging starts.
    }
  };

  const handlePointerUp = (day: Date) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressingDay(null);
    // Tap (not in range mode, not blocked): select day
    if (!anchor && !isBlocked(day) && pressedDay.current && isSameDay(pressedDay.current, day)) {
      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
    }
    pressedDay.current = null;
  };

  const handlePointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressingDay(null);
    pressedDay.current = null;
  };

  // Sheet handlers
  const handleConfirmNew = async (reason?: string) => {
    if (sheet?.kind !== "confirm-new") return;
    await addRange(sheet.start, sheet.end, reason);
    setSheet(null);
    exitRangeMode();
  };

  const handleConfirmReplace = async (reason?: string) => {
    if (sheet?.kind !== "confirm-replace") return;
    await replaceRange(sheet.oldDates, sheet.start, sheet.end, reason);
    setSheet(null);
    exitRangeMode();
  };

  const handleStartEdit = () => {
    if (sheet?.kind !== "edit-existing") return;
    const dates = sheet.rangeDates;
    setEditingOldDates(dates);
    setAnchor(parseISO(dates[0]));
    setHoverDay(parseISO(dates[dates.length - 1]));
    setIsDragging(false);
    setSheet(null);
  };

  const handleErase = async () => {
    if (sheet?.kind !== "edit-existing") return;
    await removeRange(sheet.rangeDates);
    setSheet(null);
  };

  // Close sheet but keep range-select mode active so user can keep adjusting
  const handleEditRange = () => {
    setSheet(null);
  };

  const handleCloseSheet = () => {
    setSheet(null);
    // If user cancels confirm-new/replace, also exit range mode
    if (sheet?.kind === "confirm-new" || sheet?.kind === "confirm-replace") {
      exitRangeMode();
    }
  };

  // Pull-to-refresh
  const scrollRef = useRef<HTMLDivElement>(null);
  const ptr = usePullToRefresh({
    containerRef: scrollRef,
    onRefresh: async () => { await refetchEvents(); },
  });

  return (
    <AppLayout>
      <style>{`
        @keyframes press-grow {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes press-ring {
          0% { opacity: 0; transform: scale(0.92); }
          15% { opacity: 1; }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes anchor-pulse {
          0%, 100% { transform: scale(1.08); box-shadow: 0 0 0 0 hsl(var(--primary) / 0.45); }
          50% { transform: scale(1.12); box-shadow: 0 0 0 4px hsl(var(--primary) / 0); }
        }
        @keyframes preview-in {
          0% { opacity: 0.4; transform: scale(0.94); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        ref={scrollRef}
        className="relative overflow-y-auto scrollbar-hide"
        style={{ height: "calc(100dvh - 3.5rem - env(safe-area-inset-top))" }}
      >
        <PullToRefreshIndicator {...ptr} />
        <div className="max-w-lg mx-auto space-y-5 pt-3 pb-32 md:pb-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-[140px]">
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={(v) => { haptic("selection"); setViewMode(v); setSelectedDay(null); }}
              ariaLabel="Calendar view mode"
              options={[
                { value: "month", label: "M" },
                { value: "week", label: "W" },
                { value: "day", label: "D" },
              ]}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); navigatePeriod(-1); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-bold text-foreground min-w-[90px] text-center whitespace-nowrap">
              {viewMode === "day"
                ? format(currentDate, "MMM d")
                : viewMode === "week"
                  ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")}`
                  : format(currentDate, "MMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { haptic("light"); navigatePeriod(1); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Range-select hint banner */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            inRangeSelectMode && viewMode !== "day"
              ? "max-h-16 opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-2 rounded-full glass border border-primary/30 px-2.5 py-1.5">
            <button
              onClick={() => { haptic("light"); exitRangeMode(); }}
              aria-label="Cancel"
              className="text-muted-foreground flex items-center justify-center h-7 w-7 rounded-full hover:bg-secondary/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-medium text-foreground text-center flex-1 truncate">
              {editingOldDates ? "Pick new last day" : "Pick last unavailable day"}
            </span>
            <button
              onClick={() => { haptic("medium"); openConfirmSheet(); }}
              className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground shadow-sm"
            >
              <Check className="h-3 w-3" /> Done
            </button>
          </div>
        </div>

        {/* Swipeable carousel: prev / current / next periods peek on the sides */}
        {(() => {
          const peekDates: Date[] =
            viewMode === "month"
              ? [addMonths(currentDate, -1), currentDate, addMonths(currentDate, 1)]
              : viewMode === "week"
                ? [addWeeks(currentDate, -1), currentDate, addWeeks(currentDate, 1)]
                : [addDays(currentDate, -1), currentDate, addDays(currentDate, 1)];

          const daysFor = (d: Date): Date[] => {
            if (viewMode === "month") {
              const ms = startOfMonth(d);
              const me = endOfMonth(d);
              return eachDayOfInterval({
                start: startOfWeek(ms, { weekStartsOn: 1 }),
                end: endOfWeek(me, { weekStartsOn: 1 }),
              });
            }
            if (viewMode === "week") {
              const ws = startOfWeek(d, { weekStartsOn: 1 });
              return eachDayOfInterval({ start: ws, end: addDays(ws, 6) });
            }
            return [startOfDay(d)];
          };

          const renderPane = (anchorDate: Date, isActive: boolean) => {
            if (viewMode === "day") {
              const dayEvts = eventsOnDay(anchorDate)
                .slice()
                .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
              const isTodayDay = isToday(anchorDate);
              const now = new Date();
              const nowLabel = format(now, "HH:mm");
              // Find first future event today to compute the free gap
              let gapLabel: string | null = null;
              if (isTodayDay && dayEvts.length > 0) {
                const next = dayEvts.find((e) => {
                  if (!e.time) return false;
                  const [hh, mm] = e.time.split(":").map(Number);
                  return hh * 60 + mm > now.getHours() * 60 + now.getMinutes();
                });
                if (next && next.time) {
                  const [hh, mm] = next.time.split(":").map(Number);
                  const diffMin = hh * 60 + mm - (now.getHours() * 60 + now.getMinutes());
                  if (diffMin > 0) {
                    const hours = Math.floor(diffMin / 60);
                    const mins = diffMin % 60;
                    const span = hours >= 1 ? `${hours} h${mins ? ` ${mins} min` : ""}` : `${mins} min`;
                    gapLabel = `Free for ${span} — pre-drinks, anyone?`;
                  }
                }
              }
              const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : "—:—");
              const addHref = `/add-event?mode=person&date=${format(anchorDate, "yyyy-MM-dd")}`;
              // Empty day → fun CTA card
              if (dayEvts.length === 0) {
                return (
                  <div className={`rounded-2xl card-surface p-6 transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-foreground">{format(anchorDate, "EEEE, MMMM d")}</h3>
                    </div>
                    <div className="text-center py-8 space-y-4">
                      <div className="text-6xl"><span className="animate-eyes-peek inline-block" aria-hidden>👀</span></div>
                      <div>
                        <p className="text-lg font-bold text-foreground">Empty calendar = wasted potential. Fix it.</p>
                        <p className="text-sm text-muted-foreground mt-1">{format(anchorDate, "EEEE, MMM d")} is begging for plans.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => isActive && navigate(addHref)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-[0_0_20px_hsl(var(--primary)/0.45)] hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        <Plus className="h-4 w-4" /> Add an event
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div className={`rounded-2xl card-surface p-3 transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-foreground">{format(anchorDate, "EEEE, MMMM d")}</h3>
                  </div>
                  <div className="relative pl-11">
                    {/* timeline rail */}
                    <div className="absolute left-[38px] top-1 bottom-1 w-px bg-border" />
                    {/* NOW marker */}
                    {isTodayDay && (
                      <div className="relative mb-2.5">
                        <div className="absolute -left-11 top-0.5 w-9 text-right text-[10px] font-bold text-primary tabular-nums">
                          {nowLabel}
                        </div>
                        <div className="absolute -left-[8px] top-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                        <div className="flex items-center gap-2 pl-1">
                          <div className="flex-1 h-px bg-primary/60" />
                          <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-primary">NOW</span>
                        </div>
                        {gapLabel && (
                          <p className="text-xs text-muted-foreground mt-1.5 pl-1">{gapLabel}</p>
                        )}
                      </div>
                    )}
                    {/* events */}
                    <div className="space-y-2">
                      {dayEvts.map((e) => {
                        const meta = parseCoverMetaSmall(e.description);
                        const myStatus = e.attendees?.find((a) => a.user_id === user?.id)?.status;
                        return (
                          <div key={e.id} className="relative">
                            <div className="absolute -left-11 top-2 w-9 text-left text-[10px] font-semibold text-muted-foreground tabular-nums">
                              {formatTime(e.time)}
                            </div>
                            <div className="absolute -left-[7px] top-3 h-1.5 w-1.5 rounded-full bg-primary" />
                            <Link
                              to={`/event/${e.id}`}
                              className="block rounded-xl card-surface px-2.5 py-2 hover:border-primary/40 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                {e.image_url ? (
                                  <img src={e.image_url} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                                ) : (
                                  <div
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                                    style={{ background: meta?.color ?? "hsl(var(--secondary))" }}
                                  >
                                    {meta?.emoji ?? "✨"}
                                  </div>
                                )}
                                <p className="flex-1 min-w-0 font-semibold text-sm text-foreground truncate">{e.name}</p>
                                {myStatus === "going" && (
                                  <span title="I am in" className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))] shrink-0" />
                                )}
                                {myStatus === "interested" && (
                                  <span title="Maybe" className="h-2 w-2 rounded-full border border-primary shrink-0" />
                                )}
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                    {/* Compact "+ Add to this night" */}
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => isActive && navigate(addHref)}
                        className="w-full rounded-lg border border-dashed border-primary/40 hover:border-primary/70 hover:bg-primary/5 transition-colors py-1.5 text-center text-primary text-xs font-medium"
                      >
                        + Add to this night
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            const days = daysFor(anchorDate);
            return (
              <div className={`rounded-2xl card-surface p-4 transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`}>
                <div className="grid grid-cols-7 mb-2">
                  {dayNames.map((d) => (
                    <div key={d} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {d}
                    </div>
                  ))}
                </div>
                <div
                  className="grid grid-cols-7 gap-1"
                  style={isActive && inRangeSelectMode ? { touchAction: "none" } : undefined}
                >
                  {days.map((day, i) => {
                    const dayEvents = eventsOnDay(day);
                    const isCurrentMonth = viewMode === "week" || isSameMonth(day, anchorDate);
                    const isSelected = isActive && selectedDay && isSameDay(day, selectedDay);
                    const isTodayDate = isToday(day);
                    const dSize = dotSize(day);
                    const blocked = isBlocked(day);
                    const dateKey = format(day, "yyyy-MM-dd");
                    const inPreview = isActive && previewRangeSet.has(dateKey);
                    const isAnchor = isActive && anchor && isSameDay(anchor, day);
                    const isEndOfRange =
                      isActive &&
                      inRangeSelectMode &&
                      hoverDay &&
                      !isAnchor &&
                      isSameDay(hoverDay, day) &&
                      !isSameDay(hoverDay, anchor!);
                    const isPressing = isActive && pressingDay && isSameDay(pressingDay, day);

                    const baseClasses = `relative flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 select-none ${
                      isAnchor
                        ? "ring-2 ring-primary text-foreground"
                        : isEndOfRange
                          ? "ring-2 ring-primary/80 text-foreground"
                          : blocked
                            ? "text-muted-foreground"
                            : isSelected
                              ? "bg-foreground text-background"
                              : isTodayDate
                                ? "bg-primary/15 text-foreground"
                                : isCurrentMonth
                                  ? "text-foreground hover:bg-secondary"
                                  : "text-muted-foreground/30"
                    }`;

                    let stripeStyle: React.CSSProperties = {};
                    if (blocked && !inPreview) {
                      stripeStyle = {
                        backgroundImage:
                          "repeating-linear-gradient(0deg, hsl(var(--muted-foreground) / 0.35) 0px, hsl(var(--muted-foreground) / 0.35) 2px, transparent 2px, transparent 6px)",
                      };
                    } else if (inPreview) {
                      stripeStyle = {
                        backgroundImage:
                          "repeating-linear-gradient(0deg, hsl(var(--primary) / 0.5) 0px, hsl(var(--primary) / 0.5) 2px, transparent 2px, transparent 6px)",
                        backgroundColor: "hsl(var(--primary) / 0.08)",
                      };
                    }

                    let pressTransform: React.CSSProperties = {};
                    if (isPressing) {
                      pressTransform = { animation: "press-grow 650ms ease-out forwards" };
                    } else if (isAnchor && inRangeSelectMode) {
                      pressTransform = { animation: "anchor-pulse 1.6s ease-in-out infinite" };
                    }

                    const previewAnim: React.CSSProperties =
                      inPreview && !isAnchor ? { animation: "preview-in 180ms ease-out" } : {};

                    return (
                      <button
                        key={i}
                        data-date={isActive ? dateKey : undefined}
                        data-in-preview={inPreview ? "true" : undefined}
                        onPointerDown={isActive ? (e) => handlePointerDown(day, e) : undefined}
                        onPointerMove={isActive ? handlePointerMove : undefined}
                        onPointerUp={isActive ? () => handlePointerUp(day) : undefined}
                        onPointerCancel={isActive ? handlePointerCancel : undefined}
                        onContextMenu={(e) => e.preventDefault()}
                        disabled={!isActive}
                        className={baseClasses}
                        style={{ ...stripeStyle, ...pressTransform, ...previewAnim }}
                      >
                        {isPressing && (
                          <span
                            aria-hidden
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                              boxShadow: "inset 0 0 0 2px hsl(var(--primary))",
                              animation: "press-ring 650ms ease-out forwards",
                            }}
                          />
                        )}
                        <span className="text-xs font-medium relative z-10">{format(day, "d")}</span>
                        {dayEvents.length > 0 && !blocked && (
                          <div className="mt-0.5 relative z-10">
                            <div className="rounded-full bg-primary" style={{ width: dSize, height: dSize }} />
                          </div>
                        )}
                        {!blocked && birthdaysOnDay(day).length > 0 && (
                          <span className="absolute -top-1 -right-1 text-[11px] leading-none z-20 pointer-events-none" aria-label="Friend birthday">🎂</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {isActive && (
                  <p className="mt-3 text-[10px] text-muted-foreground text-center whitespace-pre-line">
                    • Long-press to mark days unavailable · {"\n"}
                    • Tap a blocked day to edit
                  </p>
                )}
              </div>
            );
          };

          // Symmetric 3-pane peek. The active pane matches the width of the
          // event cards below (full container width). The previous and next
          // periods bleed equally from each side by PEEK px.
          const PEEK = 16;
          return (
            <div className="overflow-hidden" style={{ marginLeft: -PEEK, marginRight: -PEEK }}>
              <motion.div
                key={`${viewMode}-${currentDate.toDateString()}`}
                drag={inRangeSelectMode ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                dragMomentum={false}
                onDragEnd={(_e, info: PanInfo) => {
                  if (inRangeSelectMode) return;
                  const { offset, velocity } = info;
                  if (Math.abs(offset.x) > 60 || Math.abs(velocity.x) > 400) {
                    navigatePeriod(offset.x < 0 ? 1 : -1);
                  }
                }}
                className="flex items-stretch"
                style={{
                  touchAction: inRangeSelectMode ? "none" : "pan-y",
                  gap: 12,
                }}
              >
                {/* Prev peek — pulled left so only PEEK px shows on the left edge */}
                <div
                  className="shrink-0"
                  aria-hidden
                  style={{ width: `calc(100% - ${PEEK * 2}px)`, marginLeft: `calc(-100% + ${PEEK * 2}px - 12px + ${PEEK}px)` }}
                >
                  {renderPane(peekDates[0], false)}
                </div>
                {/* Active — same width as the cards below (container width) */}
                <div className="shrink-0" style={{ width: `calc(100% - ${PEEK * 2}px)` }}>
                  {renderPane(peekDates[1], true)}
                </div>
                {/* Next peek — pulled right so only PEEK px shows on the right edge */}
                <div
                  className="shrink-0"
                  aria-hidden
                  style={{ width: `calc(100% - ${PEEK * 2}px)`, marginRight: `calc(-100% + ${PEEK * 2}px - 12px + ${PEEK}px)` }}
                >
                  {renderPane(peekDates[2], false)}
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Show Maybes toggle — hidden when calendar has no events at all */}
        {(filteredEvents.length > 0 || hasAnyMaybe) && (
          <div className="flex items-center justify-between rounded-full glass border border-border/50 px-4 py-2">
            <span className="text-xs font-medium text-foreground">Show Maybes</span>
            <Switch checked={showMaybes} onCheckedChange={(v) => { haptic("selection"); setShowMaybes(v); }} aria-label="Toggle maybe events" />
          </div>
        )}




        {/* Blocked-day notice */}
        {selectedDay && isBlocked(selectedDay) && (
          <div className="rounded-2xl card-surface p-5 text-center">
            <Ban className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">You're unavailable this day</p>
          </div>
        )}

        {/* Events list */}
        <div className="space-y-2">
          {selectedDay && calendarListItems.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {format(selectedDay, "EEEE, MMM d")}
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedDay(null)}>
                Show all
              </Button>
            </div>
          )}

          {!showEmptyCTA && !(selectedDay && isBlocked(selectedDay)) && calendarListItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                No events {viewMode === "month" ? "this month" : viewMode === "week" ? "this week" : "today"}
                {!showMaybes && hasAnyMaybe ? " (Maybes hidden)" : ""}
              </p>
            </div>
          )}

          {calendarListItems.map((item) => {
            if (item.kind === "birthday") {
              const { day, person: p, isPast } = item;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isPast}
                  onClick={() =>
                    setCardTarget({
                      friend: { user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url },
                      birthdayDate: format(day, "yyyy-MM-dd"),
                    })
                  }
                  className={`block w-full text-left ${isPast ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center gap-4 rounded-2xl card-surface p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center gap-2 min-w-[58px]">
                      <span className="h-2.5 w-2.5 rounded-full bg-accent shrink-0" aria-label="Birthday" />
                      <div className="flex flex-col items-center min-w-[44px] relative">
                        {isToday(day) ? (
                          <span className="text-[11px] uppercase tracking-wider text-primary font-bold">Today</span>
                        ) : (
                          <>
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                              {format(day, "EEE")}
                            </span>
                            <span className="text-2xl font-bold text-foreground leading-none mt-0.5">
                              {format(day, "dd")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative w-11 h-11 shrink-0">
                      <Avatar className="w-11 h-11 rounded-xl overflow-hidden bg-secondary">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback {...avatarFallbackProps(p.display_name ?? p.user_id)}>{p.display_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 text-base leading-none drop-shadow" aria-hidden>🎂</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {p.display_name ?? "A friend"}'s birthday
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">Tap to send a card 💌</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  </div>
                </button>
              );
            }
            const event = item.event;
            const eventDate = event.date ? parseISO(event.date) : null;
            const endDate = (event as any).end_date as string | null | undefined;
            const passed = event.date ? isPastDate(endDate ?? event.date) : false;
            const goingCount = event.attendees?.filter((a) => a.status === "going").length ?? 0;
            const isGhost = event.visibility === "tentative";
            const mine = event.attendees?.find((a) => a.user_id === user?.id);
            // Personal RSVP wins over creator-implied status: a creator who
            // explicitly marks themselves "Maybe" should see the Maybe badge.
            const myStatus: "going" | "maybe" | null = mine
              ? mine.status === "going"
                ? "going"
                : "maybe"
              : event.created_by === user?.id
                ? "going"
                : null;

            return (
              <Link key={event.id} to={`/event/${event.id}`} className="block">
                <div className={`flex items-center gap-4 rounded-2xl card-surface p-4 transition-all hover:border-primary/30 ${passed ? "opacity-60" : ""} ${isGhost ? "blur-[2px] opacity-50" : ""}`}>
                  {eventDate && (
                    <div className="flex items-center gap-2 min-w-[58px]">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          myStatus === "going"
                            ? "bg-primary border border-primary"
                            : myStatus === "maybe"
                              ? "border border-primary"
                              : "border border-transparent"
                        }`}
                        aria-label={myStatus === "going" ? "Going" : myStatus === "maybe" ? "Maybe" : undefined}
                      />
                      <div className="flex flex-col items-center min-w-[44px] relative">
                        {isToday(eventDate) ? (
                          <span className="text-[11px] uppercase tracking-wider text-primary font-bold">
                            Today
                          </span>
                        ) : (
                          <>
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                              {format(eventDate, "EEE")}
                            </span>
                            <span className="text-2xl font-bold text-foreground leading-none mt-0.5">
                              {format(eventDate, "dd")}
                            </span>
                          </>
                        )}
                        {endDate && endDate !== event.date && (
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                            → {format(parseISO(endDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-secondary">
                    {(() => {
                      const cover = !event.image_url ? parseCoverMetaSmall(event.description) : null;
                      if (event.image_url) {
                        return <img src={event.image_url} alt={event.name} className="w-full h-full object-cover border-0 border-none" />;
                      }
                      if (cover) {
                        return (
                          <div
                            className="w-full h-full flex items-center justify-center text-2xl"
                            style={{ background: `hsl(${cover.color})` }}
                          >
                            {cover.emoji}
                          </div>
                        );
                      }
                      return <div className="w-full h-full flex items-center justify-center text-lg opacity-40">✦</div>;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-foreground truncate">{event.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {event.time && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                          <Clock className="h-2.5 w-2.5" />
                          {event.time.slice(0, 5)}
                        </span>
                      )}
                      {passed ? (
                        <p className="text-xs text-muted-foreground">Past</p>
                      ) : goingCount > 0 ? (
                        <p className="text-xs text-muted-foreground">{goingCount} going</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isGhost ? (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                      </div>
                    ) : passed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary/60" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        </div>
      </div>

      <BlockRangeSheet
        mode={sheet}
        onClose={handleCloseSheet}
        onConfirmNew={handleConfirmNew}
        onConfirmReplace={handleConfirmReplace}
        onStartEdit={handleStartEdit}
        onErase={handleErase}
        onEditRange={handleEditRange}
        onSaveReason={(reason) => {
          if (sheet?.kind !== "edit-existing") return;
          updateReason(sheet.rangeDates, reason);
          setSheet({ ...sheet, reason: reason || null });
        }}
      />


      {cardTarget && (
        <BirthdayCardComposer
          open={!!cardTarget}
          onOpenChange={(o) => !o && setCardTarget(null)}
          friend={cardTarget.friend}
          birthdayDate={cardTarget.birthdayDate}
        />
      )}
    </AppLayout>
  );
};

export default CalendarView;
