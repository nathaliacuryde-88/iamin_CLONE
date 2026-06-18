import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OrganizerLayout from "@/components/OrganizerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ArrowLeft, MapPin, Pencil, Users } from "lucide-react";
import CountdownPill from "@/components/organizer/CountdownPill";
import RsvpBar from "@/components/organizer/RsvpBar";
import LineModeCard from "@/components/organizer/LineModeCard";
import ProjectedFillCard from "@/components/organizer/ProjectedFillCard";
import ConvertMaybesSheet from "@/sheets/ConvertMaybesSheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const OrganizerEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convertOpen, setConvertOpen] = useState(false);


  const { data, isLoading } = useQuery({
    queryKey: ["organizer-event-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      const { data: atts } = await supabase
        .from("attendees")
        .select("user_id,status,created_at")
        .eq("event_id", id!);
      const userIds = (atts ?? []).map((a) => a.user_id);
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("user_id,display_name,avatar_url").in("user_id", userIds)
        : { data: [] };
      return {
        event: event as any,
        attendees: (atts ?? []).map((a: any) => ({
          ...a,
          profile: profiles?.find((p: any) => p.user_id === a.user_id),
        })),
      };
    },
  });

  if (isLoading || !data?.event) {
    return (
      <OrganizerLayout>
        <div className="max-w-lg mx-auto pt-6 text-sm text-muted-foreground">Loading…</div>
      </OrganizerLayout>
    );
  }

  const { event, attendees } = data;
  if (event.created_by !== user?.id) {
    return (
      <OrganizerLayout>
        <div className="max-w-lg mx-auto pt-6">
          <p className="text-sm text-muted-foreground">This isn't one of your events.</p>
        </div>
      </OrganizerLayout>
    );
  }

  const going = attendees.filter((a: any) => a.status === "going").length;
  const maybe = attendees.filter((a: any) => a.status === "interested").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayDelta = attendees.filter(
    (a: any) => a.status === "going" && a.created_at?.slice(0, 10) === today,
  ).length;

  return (
    <OrganizerLayout>
      <div className="max-w-lg mx-auto pt-4 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <Card className="glass overflow-hidden">
          {(() => {
            if (event.image_url) {
              return <img src={event.image_url} alt={event.name} className="w-full h-48 object-cover" />;
            }
            const m = (event.description ?? "").match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
            if (m) {
              return (
                <div
                  className="w-full h-48 flex items-center justify-center text-7xl drop-shadow-md"
                  style={{ background: `hsl(${m[2]})` }}
                >
                  {m[1]}
                </div>
              );
            }
            return <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5" />;
          })()}
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate">{event.name}</h1>
                {event.date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(event.date), "EEEE, MMM d")} {event.time ? `· ${event.time.slice(0, 5)}` : ""}
                  </p>
                )}
                {event.location && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.location}
                  </p>
                )}
              </div>
              <CountdownPill date={event.date} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold">RSVPs</h2>
            <RsvpBar going={going} maybe={maybe} capacity={event.capacity} todayDelta={todayDelta} />
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit event
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Guest list
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Guest list ({attendees.length})</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    {attendees.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No RSVPs yet</p>
                    )}
                    {attendees.map((a: any) => (
                      <div key={a.user_id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={a.profile?.avatar_url ?? undefined} />
                          <AvatarFallback {...avatarFallbackProps(a.profile?.display_name ?? a.user_id)}>{a.profile?.display_name?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm flex-1">{a.profile?.display_name ?? "Someone"}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            a.status === "going"
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {a.status === "going" ? "Going" : "Maybe"}
                        </span>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

        <ProjectedFillCard
          eventId={event.id}
          capacity={event.capacity}
          onOpenConvert={() => setConvertOpen(true)}
        />

        <LineModeCard eventId={event.id} eventDate={event.date} eventEndDate={(event as any).end_date} eventTime={event.time} vibeCategory={event.vibe_category} isOwner eligible={(event as any).visibility === "public"} />

        <ConvertMaybesSheet
          open={convertOpen}
          onOpenChange={setConvertOpen}
          eventId={event.id}
          eventName={event.name}
          priceCents={(event as any).price_cents}
        />
      </div>
    </OrganizerLayout>

  );
};

export default OrganizerEventDetail;
