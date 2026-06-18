import AttendeeLineCard from "@/components/AttendeeLineCard";

interface Props {
  eventId?: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
  eventTime?: string | null;
  vibeCategory?: string | null;
  isOwner?: boolean;
  eligible?: boolean;
}

/**
 * Wrapper kept for backwards-compat with the organizer event detail page.
 * The Line is now fully attendee-driven — organizers see the same
 * read/vote card as everyone else, scoped to the event's open window.
 * Only renders for eligible events (public events from organizer accounts).
 */
const LineModeCard = ({ eventId, eventDate, eventEndDate, eventTime, vibeCategory, isOwner, eligible = true }: Props) => {
  if (!eligible) return null;
  if (!eventId) {
    return (
      <div className="glass rounded-xl p-5 opacity-70">
        <h3 className="text-base font-semibold">Line</h3>
        <p className="text-xs text-muted-foreground mt-1">Opens automatically on event day — attendees report the door.</p>
      </div>
    );
  }
  return (
    <AttendeeLineCard
      eventId={eventId}
      eventDate={eventDate ?? null}
      eventEndDate={eventEndDate ?? null}
      eventTime={eventTime ?? null}
      vibeCategory={vibeCategory ?? null}
      isAttendee={!!isOwner}
    />
  );
};

export default LineModeCard;
