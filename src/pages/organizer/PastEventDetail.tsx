import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import OrganizerLayout from "@/components/OrganizerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useEventPulseStats, useEventRsvpTimeline } from "@/hooks/useEventPulseStats";
import RsvpTimelineChart from "@/components/organizer/RsvpTimelineChart";
import AnonymousFeedbackList from "@/components/organizer/AnonymousFeedbackList";
import { format, parseISO, addDays } from "date-fns";

const PastEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event } = useQuery({
    queryKey: ["organizer-past-event", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id!).maybeSingle();
      return data as any;
    },
  });
  const { data: stats } = useEventPulseStats(id);
  const { data: timeline = [] } = useEventRsvpTimeline(id);

  const { data: followerGain = 0 } = useQuery({
    queryKey: ["organizer-follower-gain", id],
    enabled: !!event?.created_by && !!event?.date,
    queryFn: async () => {
      const from = event.date;
      const to = addDays(parseISO(event.date), 3).toISOString().slice(0, 10);
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", event.created_by)
        .gte("created_at", from)
        .lte("created_at", `${to}T23:59:59`);
      return count ?? 0;
    },
  });

  const handleClone = () => {
    if (!event) return;
    sessionStorage.setItem(
      "iamin.cloneEvent",
      JSON.stringify({
        name: event.name,
        location: event.location,
        city: event.city,
        description: event.description,
        vibe_category: event.vibe_category,
        capacity: event.capacity,
      }),
    );
    navigate("/add-event?mode=organizer");
  };

  return (
    <OrganizerLayout>
      <div className="max-w-lg mx-auto pt-4 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{event?.name ?? "Event"}</h1>
          {event?.date && (
            <p className="text-xs text-muted-foreground mt-1">{format(parseISO(event.date), "MMM d, yyyy")}</p>
          )}
        </div>

        <Card className="glass">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">RSVP timeline</p>
            <RsvpTimelineChart data={timeline as any} eventDate={event?.date ?? null} />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5 space-y-1">
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Follower gain</p>
            <p className="text-3xl font-bold text-primary">+{followerGain}</p>
            <p className="text-[11px] text-muted-foreground">followers from this event</p>
          </CardContent>
        </Card>

        {stats && stats.total_ratings > 0 && (
          <Card className="glass">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Exit poll</p>
              <div className="flex items-center gap-4 text-sm">
                <span>🔥 {stats.fire_count}</span>
                <span>😐 {stats.mid_count}</span>
                <span>💀 {stats.flop_count}</span>
                <span className="ml-auto text-xl font-bold">{stats.avg_score ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {id && <AnonymousFeedbackList eventId={id} />}

        <Button onClick={handleClone} className="w-full glow-sm">
          Duplicate event →
        </Button>
      </div>
    </OrganizerLayout>
  );
};

export default PastEventDetail;
