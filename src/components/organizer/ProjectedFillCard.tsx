import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Zap, TrendingUp } from "lucide-react";

interface Props {
  eventId: string;
  capacity?: number | null;
  onOpenConvert: () => void;
}

const ProjectedFillCard = ({ eventId, capacity, onOpenConvert }: Props) => {
  const { data } = useQuery({
    queryKey: ["projected-fill", eventId],
    queryFn: async () => {
      const [{ data: atts }, { data: pacts }] = await Promise.all([
        supabase.from("attendees").select("user_id,status").eq("event_id", eventId),
        supabase
          .from("event_pacts")
          .select("id,status")
          .eq("event_id", eventId)
          .eq("status", "proposed"),
      ]);
      const confirmed = (atts ?? []).filter((a) => a.status === "going").length;
      const maybe = (atts ?? []).filter((a) => a.status === "interested").length;
      const pactPending = (pacts ?? []).length;
      const expected = Math.round(confirmed + 0.45 * maybe + 0.65 * pactPending);
      const lo = Math.max(confirmed, Math.round(expected * 0.8));
      const hi = capacity
        ? Math.min(capacity, Math.round(expected * 1.2))
        : Math.round(expected * 1.2);
      const confidence = Math.min(95, 60 + confirmed * 4);
      return { confirmed, maybe, pactPending, expected, lo, hi, confidence };
    },
  });

  if (!data) return null;
  const { confirmed, maybe, pactPending, expected, lo, hi, confidence } = data;
  const total = Math.max(1, confirmed + maybe + pactPending);
  const confPct = (confirmed / total) * 100;
  const pactPct = (pactPending / total) * 100;
  const maybePct = (maybe / total) * 100;

  return (
    <Card className="glass">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Projected fill
          </p>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-4xl font-bold tracking-tight">~{expected}</span>
          <span className="text-xs text-muted-foreground">
            expected · {lo}–{hi} range · {confidence}% confidence
          </span>
        </div>

        <div className="h-2.5 rounded-full overflow-hidden bg-secondary/60 flex">
          <div className="bg-emerald-500/80" style={{ width: `${confPct}%` }} />
          <div className="bg-primary" style={{ width: `${pactPct}%` }} />
          <div className="bg-amber-500/80" style={{ width: `${maybePct}%` }} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            {confirmed} confirmed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {pactPending} pact-pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500/80" />
            {maybe} maybe
          </span>
        </div>

        {pactPending > 0 && (
          <div className="flex gap-2 text-xs text-foreground/85 leading-relaxed pt-1">
            <Link2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">{pactPending} people are one friend away</span>{" "}
              <span className="text-muted-foreground">
                — they've pacted "I'll go if you go." Nudge the pair and they both lock in.
              </span>
            </p>
          </div>
        )}

        {maybe > 0 && (
          <Button
            variant="outline"
            className="w-full rounded-full border-border/60 gap-2"
            onClick={onOpenConvert}
          >
            <Zap className="h-4 w-4 text-amber-400" />
            Convert the {maybe} {maybe === 1 ? "maybe" : "maybes"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectedFillCard;
