import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  eventIds: string[];
}

const VIBE_EMOJI: Record<string, string> = {
  party: "🎉",
  club: "🪩",
  music: "🎵",
  food: "🍽️",
  art: "🎨",
  sports: "⚽",
  chill: "☕",
  outdoor: "🌿",
  workshop: "🛠️",
  networking: "🤝",
};

const CrowdDNACard = ({ eventIds }: Props) => {
  const { data } = useQuery({
    queryKey: ["crowd-dna", eventIds.sort().join(",")],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("id, vibe_category, attendees!inner(status)")
        .in("id", eventIds);
      const buckets: Record<string, number> = {};
      (ev as any[])?.forEach((e) => {
        const v = (e.vibe_category || "other").toLowerCase();
        const going = (e.attendees as any[]).filter((a) => a.status === "going").length;
        buckets[v] = (buckets[v] ?? 0) + going;
      });
      const total = Object.values(buckets).reduce((a, b) => a + b, 0);
      return Object.entries(buckets)
        .map(([v, n]) => ({ v, n, pct: total ? n / total : 0 }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 4);
    },
  });

  const rows = data ?? [];

  return (
    <Card className="glass">
      <CardContent className="p-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Crowd DNA
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            The vibes your crowd shows up for
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No data yet — your first events will populate this.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.v} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize">
                    {VIBE_EMOJI[row.v] ?? "✨"} {row.v}
                  </span>
                  <span className="text-muted-foreground">{Math.round(row.pct * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${row.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrowdDNACard;
