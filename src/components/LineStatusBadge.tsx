import { useLineMode, STATUS_META, formatRelative } from "@/hooks/useLineMode";
import { useState } from "react";

interface Props {
  eventId: string;
  eligible?: boolean;
  className?: string;
}

/**
 * Compact live door-status pill shown on event cover images in the feed
 * and on City Pulse. Renders nothing unless line mode is active and the
 * event is eligible (public event from an organizer account).
 */
const LineStatusBadge = ({ eventId, eligible = true, className = "" }: Props) => {
  const { isActive, current } = useLineMode(eligible ? eventId : undefined);
  const [showTime, setShowTime] = useState(false);
  if (!eligible || !isActive || !current) return null;
  const meta = STATUS_META[current.status];
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTime((v) => !v); }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] font-semibold whitespace-nowrap ${meta.pill} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${current.status !== "closed" ? "animate-pulse" : ""}`} />
      <span>{meta.label}</span>
      {showTime && <span className="opacity-75 font-normal">· {formatRelative(current.created_at)}</span>}
    </button>
  );
};

export default LineStatusBadge;
