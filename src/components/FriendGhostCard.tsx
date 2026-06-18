import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ghost } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";

interface Props {
  eventId: string;
  date?: string | null;
  compact?: boolean;
}

/**
 * Placeholder card for a friend's Ghost (tentative) event shown in their
 * profile feed/calendar. Hides event details. Tapping shakes the card and
 * exposes a Knock action — only after the host reveals the knock can the
 * friend open the event.
 */
const FriendGhostCard = ({ eventId, date, compact }: Props) => {
  const { user } = useAuth();
  const haptic = useHaptics();
  const qc = useQueryClient();
  const [shake, setShake] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const { data: myKnock } = useQuery({
    queryKey: ["my-knock", eventId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("event_knocks")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("knocker_id", user.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!user,
  });

  const status = myKnock?.status;

  const handleTap = () => {
    if (status === "revealed") {
      window.location.href = `/event/${eventId}`;
      return;
    }
    haptic("warning");
    setShake(true);
    setShowPrompt(true);
    setTimeout(() => setShake(false), 500);
  };

  const knock = async () => {
    if (!user) return;
    haptic("medium");
    const { error } = await supabase
      .from("event_knocks")
      .insert({ event_id: eventId, knocker_id: user.id });
    if (error) {
      toast.error("You need to be mutual friends with the host to knock.");
      return;
    }
    toast.success("Knock sent 👻");
    setShowPrompt(false);
    qc.invalidateQueries({ queryKey: ["my-knock", eventId, user.id] });
  };

  const eventDate = date ? parseISO(date) : null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleTap}
        className={`w-full text-left flex items-center gap-4 rounded-2xl card-surface p-${compact ? 3 : 4} opacity-90 ${shake ? "animate-shake" : ""}`}
        aria-label="Hidden ghost event"
      >
        {eventDate && (
          <div className="flex flex-col items-center min-w-[40px]">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {format(eventDate, "EEE")}
            </span>
            <span className="text-xl font-bold text-foreground leading-none mt-0.5">
              {format(eventDate, "dd")}
            </span>
          </div>
        )}
        <div className="w-10 h-10 rounded-lg shrink-0 bg-accent/15 text-accent flex items-center justify-center">
          <Ghost className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold blur-[3px] select-none">Hidden event</p>
          <p className="text-xs text-muted-foreground truncate">
            {status === "pending" && "Knock sent — waiting for host."}
            {status === "revealed" && "Host revealed — tap to open."}
            {status === "ignored" && "Host didn't reveal it."}
            {!status && "Hidden until you knock."}
          </p>
        </div>
      </button>

      {showPrompt && !status && (
        <div className="rounded-2xl card-surface p-3 flex items-center gap-3 animate-fade-in">
          <Ghost className="h-4 w-4 text-accent shrink-0" />
          <p className="text-xs flex-1">Want to knock to reveal this event?</p>
          <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)}>Not now</Button>
          <Button size="sm" onClick={knock}>👻 Knock</Button>
        </div>
      )}
    </div>
  );
};

export default FriendGhostCard;
