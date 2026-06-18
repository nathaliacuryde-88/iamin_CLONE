import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  animate,
  MotionValue,
  PanInfo,
} from "framer-motion";
import { Check, HelpCircle } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

interface WalletStackProps {
  children: React.ReactNode[];
  cardHeight?: number;
  gap?: number; // Can be negative for overlap
  header?: React.ReactNode;
  /** Rendered inside the scroll container below the last card. */
  
  onRefresh?: () => void | Promise<void>;
  /** Called when the focused card is swiped horizontally past the threshold. */
  onSwipe?: (index: number, direction: "right" | "left") => void;
  /** Called when the focused card index changes. */
  onFocusChange?: (index: number) => void;
  /** Initial card index to focus on mount (used to restore feed position). */
  initialFocusIndex?: number;
}

const PULL_THRESHOLD = 70;
const PULL_MAX = 120;

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const SWIPE_VELOCITY = 600;
const SWIPE_RATIO = 0.32; // fraction of card width to commit a swipe

function WalletCard({
  index,
  scrollY,
  cardHeight,
  gap,
  focusCenter,
  isFocused: isFocusedProp,
  onSwipe,
  onAdvance,
  reduceMotion,
  children,
  registerRef,
}: {
  index: number;
  scrollY: MotionValue<number>;
  cardHeight: number;
  gap: number;
  focusCenter: number;
  isFocused: boolean;
  onSwipe?: (index: number, dir: "right" | "left") => void;
  onAdvance?: (index: number) => void;
  reduceMotion: boolean;
  children: React.ReactNode;
  registerRef: (i: number, el: HTMLDivElement | null) => void;
}) {
  const cardTop = index * (cardHeight + gap);
  const viewCenter = focusCenter - cardHeight / 2;
  const haptic = useHaptics();

  const distFromCenter = useTransform(scrollY, (scroll) => {
    const currentPos = cardTop - scroll;
    return currentPos - viewCenter;
  });

  const normalizedDist = useTransform(distFromCenter, (d) => d / (cardHeight + Math.abs(gap)));

  // Focused card sits forward and large; neighbours shrink and recede sharply so the
  // focused card visually floats on top of the stack.
  const scale = useTransform(normalizedDist, [-3, -1, 0, 1, 3], [0.78, 0.88, 1, 0.88, 0.78]);
  const rotateX = useTransform(normalizedDist, [-2, -1, 0, 1, 2], [10, 5, 0, -5, -10]);
  const translateY = useTransform(normalizedDist, [-2, -1, 0, 1, 2], [24, 12, 0, 12, 24]);
  const translateZ = useTransform(normalizedDist, [-2, -1, 0, 1, 2], [-80, -40, 0, -40, -80]);
  const opacity = useTransform(normalizedDist, [-3, -1.5, 0, 1.5, 3], [0.35, 0.6, 1, 0.6, 0.35]);
  // Big z-index gap so the focused card sits unambiguously above siblings.
  const zIndex = useTransform(normalizedDist, (d) => {
    const abs = Math.abs(d);
    if (abs < 0.25) return 200;
    return Math.round(100 - abs * 20);
  });
  const brightness = useTransform(normalizedDist, [-2, -1, 0, 1, 2], [0.45, 0.7, 1, 0.7, 0.45]);
  const focusFlag = useTransform(normalizedDist, (d) => (Math.abs(d) < 0.25 ? 1 : 0));
  const shadowStrength = useTransform(focusFlag, (f) =>
    f
      ? "0 12px 32px -16px hsl(var(--card-shadow) / var(--card-shadow-strength-focus, 0.45)), 0 4px 12px -6px hsl(var(--primary) / 0.18)"
      : "0 4px 14px -8px hsl(var(--card-shadow) / var(--card-shadow-strength-rest, 0.3))"
  );
  const filter = useTransform(brightness, (v) => `brightness(${v})`);

  // ─── Horizontal swipe (only when this card is the focused one) ───
  const x = useMotionValue(0);
  const innerOpacity = useMotionValue(1);
  const dragRotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const innerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(320);
  const crossedRef = useRef(false);
  const flyingRef = useRef(false);

  useEffect(() => {
    if (innerRef.current) widthRef.current = innerRef.current.getBoundingClientRect().width || 320;
  }, [isFocusedProp]);

  // Selection haptic when the user crosses the threshold mid-drag.
  useMotionValueEvent(x, "change", (v) => {
    if (!isFocusedProp || !onSwipe || flyingRef.current) return;
    const t = widthRef.current * SWIPE_RATIO;
    const past = Math.abs(v) >= t;
    if (past && !crossedRef.current) {
      crossedRef.current = true;
      if (!reduceMotion) haptic("selection");
    } else if (!past && crossedRef.current) {
      crossedRef.current = false;
    }
  });

  const commitDist = widthRef.current * SWIPE_RATIO;
  const goingHintOpacity = useTransform(x, [0, commitDist], [0, 1]);
  const skipHintOpacity = useTransform(x, [-commitDist, 0], [1, 0]);
  // Tinted overlay — primary green-ish for going (uses primary), purple for maybe.
  const goingTintOpacity = useTransform(x, [0, commitDist * 0.4, commitDist], [0, 0.18, 0.32]);
  const maybeTintOpacity = useTransform(x, [-commitDist, -commitDist * 0.4, 0], [0.32, 0.18, 0]);
  // Center icon scale grows from 0.5 → 1.4 as commit threshold approaches.
  const goingIconScale = useTransform(x, [0, commitDist], [0.5, 1.4]);
  const maybeIconScale = useTransform(x, [-commitDist, 0], [1.4, 0.5]);
  const goingIconOpacity = useTransform(x, [0, commitDist * 0.25, commitDist], [0, 0.6, 1]);
  const maybeIconOpacity = useTransform(x, [-commitDist, -commitDist * 0.25, 0], [1, 0.6, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isFocusedProp || !onSwipe) {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
      return;
    }
    const t = widthRef.current * SWIPE_RATIO;
    const past = Math.abs(info.offset.x) >= t || Math.abs(info.velocity.x) >= SWIPE_VELOCITY;
    if (!past) {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
      crossedRef.current = false;
      return;
    }
    const dir: "right" | "left" = info.offset.x > 0 ? "right" : "left";
    flyingRef.current = true;
    if (!reduceMotion) haptic(dir === "right" ? "success" : "light");
    const flyTo = dir === "right" ? window.innerWidth * 1.1 : -window.innerWidth * 1.1;
    const dur = reduceMotion ? 0 : 0.28;
    animate(x, flyTo, { duration: dur, ease: "easeOut" });
    animate(innerOpacity, 0, { duration: dur, ease: "easeOut" });
    onSwipe(index, dir);
    onAdvance?.(index);
    // Reset after the consumer has had a tick to advance the deck.
    window.setTimeout(() => {
      x.set(0);
      innerOpacity.set(1);
      flyingRef.current = false;
      crossedRef.current = false;
    }, dur * 1000 + 80);
  };

  const dragEnabled = isFocusedProp && !!onSwipe;

  return (
    <motion.div
      ref={(el) => registerRef(index, el)}
      data-card-index={index}
      className="w-full shrink-0 origin-center will-change-transform snap-center snap-always"
      style={{
        height: cardHeight,
        marginBottom: gap,
        scale,
        rotateX,
        y: translateY,
        z: translateZ,
        opacity,
        zIndex,
        filter,
        transformStyle: "preserve-3d" as any,
      }}
    >
      <motion.div
        ref={innerRef}
        className="relative h-full rounded-2xl bg-card border border-border overflow-hidden [&_img]:pointer-events-none [&_img]:select-none"
        style={{
          boxShadow: shadowStrength,
          x: dragEnabled ? x : 0,
          rotate: dragEnabled && !reduceMotion ? dragRotate : 0,
          opacity: innerOpacity,
          touchAction: dragEnabled ? "pan-y" : "auto",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
        drag={dragEnabled ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {children}
        {/* Swipe overlay + hints — only show on focused card */}
        {dragEnabled && (
          <>
            {/* Going (right) — primary-tinted full-card overlay */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-40 rounded-2xl bg-primary"
              style={{ opacity: goingTintOpacity }}
            />
            {/* Maybe (left) — softer primary tint with diagonal stripes */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-40 rounded-2xl"
              style={{
                opacity: maybeTintOpacity,
                background:
                  "linear-gradient(135deg, hsl(var(--primary) / 0.7), hsl(var(--accent) / 0.55))",
              }}
            />
            {/* Big center icons that scale with progress */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
              style={{ opacity: goingIconOpacity, scale: goingIconScale }}
            >
              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary text-primary-foreground shadow-[0_16px_48px_-12px_hsl(var(--primary)/0.8)] ring-4 ring-primary-foreground/20">
                <Check className="h-12 w-12" strokeWidth={3} />
              </div>
            </motion.div>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
              style={{ opacity: maybeIconOpacity, scale: maybeIconScale }}
            >
              <div className="flex items-center justify-center h-24 w-24 rounded-full bg-card/90 backdrop-blur-md text-primary shadow-[0_16px_48px_-12px_hsl(var(--primary)/0.6)] ring-4 ring-primary/30">
                <HelpCircle className="h-12 w-12" strokeWidth={2.5} />
              </div>
            </motion.div>
            {/* Edge hint chips */}
            <motion.div
              className="pointer-events-none absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] ring-1 ring-primary/40"
              style={{ opacity: goingHintOpacity }}
            >
              <Check className="h-3.5 w-3.5" />
              I'm in
            </motion.div>
            <motion.div
              className="pointer-events-none absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-wider border border-primary/40 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.4)]"
              style={{ opacity: skipHintOpacity }}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Maybe
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// Clearance below the snap viewport so cards visually pass under the floating
// bottom nav (pill height ~64px + 12px gap + breathing room).
const BOTTOM_NAV_CLEARANCE_PX = 128;
const SNAP_TOP_PAD_PX = 12;

const WalletStack = ({ children, cardHeight = 320, gap = -20, header, onRefresh, onSwipe, onFocusChange, initialFocusIndex }: WalletStackProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(600);

  const bottomReserve = BOTTOM_NAV_CLEARANCE_PX;
  // Available vertical room between top bar and floating nav for a focused card.
  const visibleH = Math.max(0, containerH - bottomReserve - SNAP_TOP_PAD_PX);
  // Clamp card height to the full container minus a hair of padding (nav floats
  // over, doesn't reserve space).
  const effectiveCardHeight = Math.max(280, Math.min(cardHeight, containerH - 16));

  const haptic = useHaptics();
  const reduceMotion = useRef(prefersReducedMotion());

  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const focusedIdxRef = useRef<number>(0);
  const observerInitialized = useRef(false);

  const registerRef = useCallback((i: number, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(i, el);
    else cardRefs.current.delete(i);
  }, []);

  const advanceToNext = useCallback((fromIndex: number) => {
    const nextIdx = Math.min(fromIndex + 1, children.length - 1);
    if (nextIdx === fromIndex) return;
    const nextEl = cardRefs.current.get(nextIdx);
    if (nextEl) {
      nextEl.scrollIntoView({ behavior: reduceMotion.current ? "auto" : "smooth", block: "center" });
    }
  }, [children.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerH(e.contentRect.height));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // IntersectionObserver to fire selection haptic when focused card changes.
  // rootMargin shrinks the detection zone to match the visual snap viewport
  // (between top bar and floating bottom nav).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = focusedIdxRef.current;
        let bestRatio = 0;
        for (const entry of entries) {
          const i = Number((entry.target as HTMLElement).dataset.cardIndex);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = i;
          }
        }
        if (bestRatio < 0.6) return;
        if (bestIdx !== focusedIdxRef.current) {
          if (observerInitialized.current && !reduceMotion.current) {
            haptic("selection");
          }
          focusedIdxRef.current = bestIdx;
          setFocusedIdx(bestIdx);
          onFocusChange?.(bestIdx);
          observerInitialized.current = true;
        }
      },
      { root, threshold: [0.6, 0.75, 0.9], rootMargin: `-${SNAP_TOP_PAD_PX}px 0px -${bottomReserve}px 0px` }
    );
    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [children.length, haptic, bottomReserve, onFocusChange]);

  // Restore focus on mount when initialFocusIndex is provided (e.g., returning from EventDetail).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (initialFocusIndex == null || initialFocusIndex <= 0) return;
    const el = cardRefs.current.get(initialFocusIndex);
    if (!el) return;
    restoredRef.current = true;
    el.scrollIntoView({ behavior: "auto", block: "center" });
    focusedIdxRef.current = initialFocusIndex;
    setFocusedIdx(initialFocusIndex);
    observerInitialized.current = true;
  }, [initialFocusIndex, children.length]);

  // Pull to refresh (shared hook)
  const {
    pullDistance,
    refreshing,
    indicatorOpacity,
    indicatorRotate,
    indicatorScale,
  } = usePullToRefresh({ containerRef, onRefresh });

  const { scrollY } = useScroll({ container: containerRef });

  // Focus center: midpoint of the visible area between top bar and bottom nav.
  const hasHeader = !!header;
  
  const focusCenter = SNAP_TOP_PAD_PX + visibleH / 2;
  const padTop = Math.max(hasHeader ? 6 : 12, focusCenter - effectiveCardHeight / 2 - (hasHeader ? 44 : 0));
  // Bottom padding = clearance for the floating nav. Cards scroll all the way
  // past it; snap math keeps the focused card centred above the bar.
  const padBottom = `calc(${BOTTOM_NAV_CLEARANCE_PX}px + env(safe-area-inset-bottom))`;


  return (
    <div
      ref={containerRef}
      className="overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide relative"
      style={{
        // Fill the flex parent exactly (Index.tsx sizes the feed column to the
        // visible area below the top bar). Don't hard-code 100dvh math here — it
        // broke on iOS standalone: the sticky tab strip offset this container,
        // making it taller than the screen and pushing focused cards (and their
        // action buttons) down under the floating nav.
        height: "100%",
        perspective: "1200px",
        perspectiveOrigin: "center center",
        WebkitOverflowScrolling: "touch",
        scrollSnapType: reduceMotion.current ? "none" : "y mandatory",
        scrollPaddingTop: `${SNAP_TOP_PAD_PX}px`,
        scrollPaddingBottom: `calc(${BOTTOM_NAV_CLEARANCE_PX}px + env(safe-area-inset-bottom))`,
      }}
    >
      {/* Pull-to-refresh indicator */}
      {onRefresh && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          refreshing={refreshing}
          indicatorOpacity={indicatorOpacity}
          indicatorRotate={indicatorRotate}
          indicatorScale={indicatorScale}
        />
      )}

      {header ? (
        <div className="pt-3 pb-4 w-full overflow-visible">{header}</div>
      ) : null}
      <div style={{ paddingTop: padTop, paddingBottom: padBottom }}>

        {children.map((child, i) => (
          <WalletCard
            key={i}
            index={i}
            scrollY={scrollY}
            cardHeight={effectiveCardHeight}
            gap={gap}
            focusCenter={focusCenter}
            isFocused={i === focusedIdx}
            onSwipe={onSwipe}
            onAdvance={advanceToNext}
            reduceMotion={reduceMotion.current}
            registerRef={registerRef}
          >
            {child}
          </WalletCard>
        ))}
      </div>
    </div>
  );
};

export default WalletStack;
