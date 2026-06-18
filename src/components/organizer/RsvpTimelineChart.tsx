interface Point { day: string; confirms: number; }

const RsvpTimelineChart = ({ data, eventDate }: { data: Point[]; eventDate: string | null }) => {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
        No RSVP history yet
      </div>
    );
  }
  // Cumulative confirms
  let running = 0;
  const cum = data.map((d) => ({ day: d.day, total: (running += d.confirms) }));
  const max = Math.max(...cum.map((c) => c.total), 1);
  const w = 320;
  const h = 120;
  const stepX = cum.length > 1 ? w / (cum.length - 1) : w;
  const path = cum
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (p.total / max) * h}`)
    .join(" ");
  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
        {cum.map((p, i) => (
          <circle key={i} cx={i * stepX} cy={h - (p.total / max) * h} r={3} fill="hsl(var(--primary))" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{cum[0]?.day}</span>
        <span>{eventDate ?? cum[cum.length - 1]?.day}</span>
      </div>
    </div>
  );
};

export default RsvpTimelineChart;
