import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  emoji?: string;
};

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  /** Visual size — "sm" matches calendar M/W/D, "md" default, "lg" = 44 px touch target */
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

/**
 * iOS-style segmented control with a sliding pill that springs between
 * selections. Fires a `selection` haptic on every change.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const haptic = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  const measure = () => {
    const container = containerRef.current;
    const el = itemRefs.current.get(value);
    if (!container || !el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    if (eRect.width === 0) return;
    setPill({ x: eRect.left - cRect.left, w: eRect.width });
  };

  useLayoutEffect(() => {
    measure();
    const r1 = requestAnimationFrame(measure);
    const r2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.length, size]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    itemRefs.current.forEach((el) => ro.observe(el));
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.length]);

  const heightCls = size === "sm" ? "h-8" : size === "lg" ? "h-11" : "h-10";
  const padCls = size === "sm" ? "p-0.5" : "p-1";
  const textCls = size === "sm" ? "text-xs" : "text-sm";
  const pillInset = size === "sm" ? 2 : 4;

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex w-full items-center bg-secondary/70 backdrop-blur-md border border-border/50 rounded-full overflow-hidden",
        heightCls,
        padCls,
        className,
      )}
    >
      {pill && (
        <motion.span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-card shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.25)] border border-border/60"
          initial={false}
          animate={{ x: pill.x - pillInset, width: pill.w }}
          transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.8 }}
          style={{ left: 0 }}
        />
      )}
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              if (el) itemRefs.current.set(opt.value, el);
              else itemRefs.current.delete(opt.value);
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (opt.value === value) return;
              haptic("selection");
              onChange(opt.value);
            }}
            className={cn(
              "relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors whitespace-nowrap",
              textCls,
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.emoji ? (
              <motion.span
                aria-hidden
                className="inline-block text-base leading-none"
                animate={
                  active
                    ? { scale: [1, 1.35, 0.95, 1.1, 1], rotate: [0, -12, 10, -4, 0] }
                    : { scale: 1, rotate: 0 }
                }
                whileHover={{ scale: 1.15, rotate: -6 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                {opt.emoji}
              </motion.span>
            ) : (
              Icon && <Icon className="h-3.5 w-3.5" />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
