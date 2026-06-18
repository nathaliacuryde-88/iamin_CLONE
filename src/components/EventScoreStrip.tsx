import { useEventScore } from "@/hooks/useExitPoll";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface Props {
  eventId: string;
  /** Hide until the event has at least N ratings. */
  minRatings?: number;
}

/**
 * Aggregate event vibe-check shown on past events. Styled to match the other
 * full-width tactile widgets that sit inside a passed event (Time Capsule,
 * Comments, etc.) — icon + title in the header, content below.
 */
const EventScoreStrip = ({ eventId, minRatings = 1 }: Props) => {
  const { data } = useEventScore(eventId);
  if (!data || data.total_ratings < minRatings) return null;
  return (
    <Card className="tactile-widget">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-accent" />
          Vibe Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5 text-sm text-foreground/80">
          <span>🔥 {data.fire_count}</span>
          <span>😐 {data.mid_count}</span>
          <span>💀 {data.flop_count}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventScoreStrip;
