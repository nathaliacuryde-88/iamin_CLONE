import { Link } from "react-router-dom";
import { format, parseISO, isPast, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import OrganizerLayout from "@/components/OrganizerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import { useCityEvents } from "@/hooks/useCityEvents";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, ChevronRight, CalendarDays } from "lucide-react";

import LineStatusBadge from "@/components/LineStatusBadge";

const parseCoverMetaSmall = (description: string | null | undefined) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};

const EventRow = ({ ev, large = false }: { ev: any; large?: boolean }) => {
  const cover = !ev.image_url ? parseCoverMetaSmall(ev.description) : null;
  return (
  <Link to={`/organizer/event/${ev.id}`} className="block">
    <Card className="glass overflow-hidden hover:border-primary/40 transition-colors">
      {/* Top: name + date — matches feed EventCard rhythm */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="font-semibold text-base leading-tight truncate">{ev.name}</h3>
        {ev.date && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {format(parseISO(ev.date), "EEE, MMM d")}
            {ev.time ? ` · ${String(ev.time).slice(0, 5)}` : ""}
          </p>
        )}
      </div>
      <div
        className={`relative ${large ? "h-44" : "h-32"} bg-gradient-to-br from-primary/15 via-primary/5 to-primary/15`}
        style={cover ? { background: `hsl(${cover.color})` } : undefined}
      >
        {ev.image_url ? (
          <img src={ev.image_url} alt={ev.name} className="w-full h-full object-cover" />
        ) : cover ? (
          <div className="w-full h-full flex items-center justify-center text-5xl drop-shadow-md">{cover.emoji}</div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">✦</div>
        )}
        <div className="absolute top-2 right-2">
          <LineStatusBadge eventId={ev.id} eligible={ev.visibility === "public"} />
        </div>
      </div>
      {/* Bottom: location + going count */}
      <CardContent className="p-3">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {ev.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" /> {ev.location}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto shrink-0">
            <Users className="h-3 w-3" /> {ev.going}
          </span>
        </div>
      </CardContent>
    </Card>
  </Link>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: events, isLoading } = useOrganizerEvents();

  const { data: profile } = useQuery({
    queryKey: ["profile-org", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name,city")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as any;
    },
  });

  const upcoming = (events ?? []).filter((e) => !e.date || !isPast(endOfDay(parseISO(e.date))));
  const [next, ...rest] = upcoming;

  // City teaser: 2 events this weekend in same city, not by me
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().slice(0, 10);
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().slice(0, 10);
  const { data: cityEvents } = useCityEvents(profile?.city ?? "Stuttgart", weekStart, weekEnd);
  const teaser = (cityEvents ?? []).slice(0, 2);

  return (
    <OrganizerLayout>
      <div className="max-w-lg mx-auto pt-4 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey {profile?.display_name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your hosting deck.</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-44 rounded-2xl" />
        ) : !next ? (
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-semibold">No upcoming events yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tap + to create your first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Next up</p>
              <EventRow ev={next} large />
            </div>

            {rest.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Upcoming</p>
                {rest.map((ev) => <EventRow key={ev.id} ev={ev} />)}
              </div>
            )}
          </div>
        )}

        <Link to="/organizer/city" className="block">
          <Card className="glass hover:border-primary/40 transition-colors">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">See what else is happening this weekend</p>
                <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                  {teaser.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground">Nothing trending in {profile?.city ?? "your city"}</span>
                  ) : (
                    teaser.map((e: any) => (
                      <span
                        key={e.id}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground truncate max-w-[140px]"
                      >
                        {e.name} · {e.going}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </OrganizerLayout>
  );
};

export default Dashboard;
