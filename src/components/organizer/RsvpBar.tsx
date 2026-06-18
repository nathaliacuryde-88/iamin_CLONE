import { TrendingUp } from "lucide-react";

interface Props {
  going: number;
  maybe: number;
  capacity?: number | null;
  todayDelta?: number;
}

const RsvpBar = ({ going, maybe, capacity, todayDelta = 0 }: Props) => {
  const total = capacity && capacity > 0 ? capacity : Math.max(going + maybe, 1);
  const goingPct = Math.min(100, (going / total) * 100);
  const maybePct = Math.min(100 - goingPct, (maybe / total) * 100);
  const remainingPct = Math.max(0, 100 - goingPct - maybePct);

  return (
    <div className="space-y-2">
      <div className="h-3 rounded-full overflow-hidden flex bg-secondary/60">
        <div className="bg-primary transition-all" style={{ width: `${goingPct}%` }} />
        <div className="bg-primary/40 transition-all" style={{ width: `${maybePct}%` }} />
        {capacity ? (
          <div className="bg-muted/40 transition-all" style={{ width: `${remainingPct}%` }} />
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span><span className="text-foreground font-semibold">{going}</span> confirmed</span>
          <span>·</span>
          <span><span className="text-foreground font-semibold">{maybe}</span> maybe</span>
          {capacity ? (
            <>
              <span>·</span>
              <span><span className="text-foreground font-semibold">{capacity}</span> capacity</span>
            </>
          ) : null}
        </div>
      </div>
      {todayDelta > 0 && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-green-400">
          <TrendingUp className="h-3 w-3" />
          +{todayDelta} confirmed today
        </div>
      )}
    </div>
  );
};

export default RsvpBar;
