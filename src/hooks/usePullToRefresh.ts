import { RefObject, useEffect, useRef, useState } from "react";
import { useHaptics } from "@/hooks/useHaptics";

export const PULL_THRESHOLD = 70;
export const PULL_MAX = 110;

interface Options {
  containerRef: RefObject<HTMLElement>;
  onRefresh?: () => void | Promise<void>;
  enabled?: boolean;
}

/**
 * iOS-style pull-to-refresh on any scrollable container.
 * Returns the values needed to render an indicator.
 */
export const usePullToRefresh = ({ containerRef, onRefresh, enabled = true }: Options) => {
  const haptic = useHaptics();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const ready = useRef(false);
  const active = useRef(false);

  useEffect(() => {
    if (!enabled || !onRefresh) return;
    const el = containerRef.current;
    if (!el) return;

    // Skip on non-touch desktop to avoid accidental trackpad triggers
    if (typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
      ready.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null) return;
      if (e.touches.length !== 1) {
        active.current = false;
        setPullDistance(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }
      const eased = Math.min(PULL_MAX, delta * 0.55);
      setPullDistance(eased);
      if (eased >= PULL_THRESHOLD && !ready.current) {
        ready.current = true;
        haptic("light");
      } else if (eased < PULL_THRESHOLD && ready.current) {
        ready.current = false;
      }
    };
    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (ready.current) {
        ready.current = false;
        haptic("success");
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, onRefresh, enabled, haptic]);

  const indicatorOpacity = Math.min(1, (pullDistance || (refreshing ? PULL_THRESHOLD : 0)) / PULL_THRESHOLD);
  const indicatorRotate = pullDistance * 3;
  const indicatorScale = 0.6 + 0.4 * Math.min(1, pullDistance / PULL_THRESHOLD);

  return { pullDistance, refreshing, indicatorOpacity, indicatorRotate, indicatorScale };
};
