import { useCreatorScore } from "@/hooks/useExitPoll";

interface Props {
  userId: string | undefined;
  /** Hide until creator has at least N rated events. */
  minEvents?: number;
}

/**
 * Compact track-record pill: "🔥 87% · 12 events".
 * Renders nothing until the creator has enough rated events.
 */
const CreatorScoreBadge = ({ userId, minEvents = 3 }: Props) => {
  const { data } = useCreatorScore(userId);
  if (!data || data.events_rated < minEvents || data.fire_pct == null) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-xs"
      title="Share of attendees who rated this organizer's events as Worth it"
    >
      <span>🔥</span>
      <span className="font-semibold">{data.fire_pct}%</span>
      <span className="text-muted-foreground">worth it · {data.events_rated} rated</span>
    </div>
  );
};

export default CreatorScoreBadge;
