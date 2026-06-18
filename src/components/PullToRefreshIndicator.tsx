interface Props {
  pullDistance: number;
  refreshing: boolean;
  indicatorOpacity: number;
  indicatorRotate: number;
  indicatorScale: number;
}

/**
 * Shared spinning ✦ pill used for pull-to-refresh across pages.
 */
const PullToRefreshIndicator = ({
  pullDistance,
  refreshing,
  indicatorOpacity,
  indicatorRotate,
  indicatorScale,
}: Props) => {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 top-2 flex justify-center z-50"
      style={{
        opacity: refreshing ? 1 : indicatorOpacity,
        transform: `translateY(${Math.min(pullDistance * 0.5, 30)}px)`,
        transition: refreshing || pullDistance === 0 ? "opacity 200ms, transform 200ms" : "none",
      }}
    >
      <div
        className={`h-8 w-8 rounded-full bg-card/80 backdrop-blur-md border border-border/60 flex items-center justify-center text-primary shadow-[0_4px_16px_-8px_hsl(var(--primary)/0.4)] ${
          refreshing ? "animate-spin" : ""
        }`}
        style={{
          transform: refreshing ? undefined : `rotate(${indicatorRotate}deg) scale(${indicatorScale})`,
        }}
      >
        <span className="text-sm leading-none">✦</span>
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
