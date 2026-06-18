import * as React from "react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

const ITEM_HEIGHT = 36;
const VISIBLE_ROWS = 5; // odd number, selected centered
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);

export type WheelOption = { value: string; label: string };

interface WheelPickerProps {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  /** When true, scrolling past the end loops back to the start (and vice versa). */
  loop?: boolean;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
  options,
  value,
  onChange,
  className,
  ariaLabel,
  loop = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const scrollTimer = React.useRef<number | null>(null);
  const isUserScrolling = React.useRef(false);
  const haptic = useHaptics();

  // For looping we render 3 stacked copies of the options. The "middle"
  // copy is the canonical position; we silently re-center scroll into it
  // whenever the user drifts into the top or bottom copy.
  const N = options.length;
  const COPIES = loop && N > 0 ? 3 : 1;
  const looped = React.useMemo(
    () => (COPIES === 1 ? options : Array.from({ length: COPIES }, () => options).flat()),
    [options, COPIES],
  );

  const baseSelected = Math.max(0, options.findIndex((o) => o.value === value));
  // Position inside the middle copy when looping
  const selectedIndex = loop && N > 0 ? N + baseSelected : baseSelected;

  // Sync external value changes -> scroll position (snap to middle copy when looping)
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isUserScrolling.current) return;
    const target = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "auto" });
    }
  }, [selectedIndex]);

  const handleScroll = () => {
    isUserScrolling.current = true;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      let idx = Math.round(el.scrollTop / ITEM_HEIGHT);

      if (loop && N > 0) {
        // Re-center into middle copy if we drifted into top/bottom copy
        if (idx < N || idx >= 2 * N) {
          const mod = ((idx % N) + N) % N;
          idx = N + mod;
          el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "auto" });
        }
        const opt = options[idx - N];
        isUserScrolling.current = false;
        const target = idx * ITEM_HEIGHT;
        if (Math.abs(el.scrollTop - target) > 0.5) {
          el.scrollTo({ top: target, behavior: "smooth" });
        }
        if (opt && opt.value !== value) {
          haptic("selection");
          onChange(opt.value);
        }
      } else {
        const clamped = Math.max(0, Math.min(options.length - 1, idx));
        const opt = options[clamped];
        isUserScrolling.current = false;
        const target = clamped * ITEM_HEIGHT;
        if (Math.abs(el.scrollTop - target) > 0.5) {
          el.scrollTo({ top: target, behavior: "smooth" });
        }
        if (opt && opt.value !== value) {
          haptic("selection");
          onChange(opt.value);
        }
      }
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = loop && N > 0 ? (baseSelected + 1) % N : Math.min(N - 1, baseSelected + 1);
      const next = options[nextIdx];
      if (next && next.value !== value) {
        haptic("selection");
        onChange(next.value);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = loop && N > 0 ? (baseSelected - 1 + N) % N : Math.max(0, baseSelected - 1);
      const prev = options[prevIdx];
      if (prev && prev.value !== value) {
        haptic("selection");
        onChange(prev.value);
      }
    }
  };

  const containerHeight = ITEM_HEIGHT * VISIBLE_ROWS;

  return (
    <div
      className={cn("relative select-none", className)}
      style={{ height: containerHeight }}
      role="listbox"
      aria-label={ariaLabel}
    >
      {/* Center selection band */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 border-y border-border/60"
        style={{
          top: PAD_ROWS * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        }}
      />
      {/* Top + bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[36px] bg-gradient-to-b from-card to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[36px] bg-gradient-to-t from-card to-transparent" />

      <div
        ref={ref}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="h-full overflow-y-scroll outline-none scrollbar-none"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.scrollbar-none::-webkit-scrollbar{display:none}`}</style>
        {/* Top spacer */}
        <div style={{ height: PAD_ROWS * ITEM_HEIGHT }} />
        {looped.map((opt, i) => {
          const distance = Math.abs(i - selectedIndex);
          return (
            <div
              key={`${opt.value}-${i}`}
              onClick={() => {
                if (opt.value !== value) {
                  haptic("selection");
                  onChange(opt.value);
                }
              }}
              className={cn(
                "flex items-center justify-center transition-all duration-150 cursor-pointer tabular-nums",
                distance === 0 && "text-foreground font-semibold text-xl",
                distance === 1 && "text-foreground/70 text-base",
                distance >= 2 && "text-foreground/30 text-sm",
              )}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
              }}
              role="option"
              aria-selected={distance === 0}
            >
              {opt.label}
            </div>
          );
        })}
        {/* Bottom spacer */}
        <div style={{ height: PAD_ROWS * ITEM_HEIGHT }} />
      </div>
    </div>
  );
};
