import { useMemo, useState } from "react";
import OrganizerLayout from "@/components/OrganizerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCityEvents } from "@/hooks/useCityEvents";
import { useOrganizerEvents } from "@/hooks/useOrganizerEvents";
import {
  startOfWeek, endOfWeek, addDays, format, parseISO, isFriday, isSaturday, isSunday,
} from "date-fns";
import { MapPin, Users, ChevronDown } from "lucide-react";
import ConflictBadge from "@/components/organizer/ConflictBadge";
import IOSDateTimePicker from "@/components/IOSDateTimePicker";
import CityAutocomplete from "@/components/CityAutocomplete";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Range = "week" | "weekend" | "custom";

const City = () => {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile-city", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("city").eq("user_id", user!.id).maybeSingle();
      return data as any;
    },
  });

  const [city, setCity] = useState<string | null>(null);
  const activeCity = city ?? profile?.city ?? "Stuttgart";
  const [range, setRange] = useState<Range>("week");
  const [customDate, setCustomDate] = useState<string>("");

  const { from, to, label } = useMemo(() => {
    const now = new Date();
    if (range === "week") {
      const a = startOfWeek(now, { weekStartsOn: 1 });
      const b = endOfWeek(now, { weekStartsOn: 1 });
      return {
        from: a.toISOString().slice(0, 10),
        to: b.toISOString().slice(0, 10),
        label: `${format(a, "MMM d")} – ${format(b, "MMM d")}`,
      };
    }
    if (range === "weekend") {
      // Friday → Sunday
      const day = now.getDay();
      const fridayOffset = (5 - day + 7) % 7;
      const fri = addDays(now, fridayOffset);
      const sun = addDays(fri, 2);
      return {
        from: fri.toISOString().slice(0, 10),
        to: sun.toISOString().slice(0, 10),
        label: `${format(fri, "EEE MMM d")} – ${format(sun, "EEE MMM d")}`,
      };
    }
    const d = customDate || now.toISOString().slice(0, 10);
    return { from: d, to: d, label: format(parseISO(d), "EEEE, MMM d") };
  }, [range, customDate]);

  const { data: events = [], isLoading } = useCityEvents(activeCity, from, to);
  const { data: myEvents = [] } = useOrganizerEvents();

  const conflictFor = (date: string | null) => {
    if (!date) return null;
    const mine = myEvents.find((e) => e.date === date);
    if (!mine) return null;
    const d = mine.date ? format(parseISO(mine.date), "EEE d") : "event";
    return `${d} ${mine.name}`;
  };

  return (
    <OrganizerLayout>
      <div className="max-w-lg mx-auto pt-4 space-y-4">
        <div>
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1.5 text-2xl font-bold tracking-tight">
                {activeCity}
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[60vh]">
              <SheetHeader>
                <SheetTitle>Change city</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <CityAutocomplete value={activeCity} onChange={(v) => setCity(v)} placeholder="Search city" />
              </div>
            </SheetContent>
          </Sheet>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>

        <div className="flex items-center gap-2">
          {(["week", "weekend", "custom"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "week" ? "This week" : r === "weekend" ? "This weekend" : "Custom date"}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <IOSDateTimePicker mode="date" value={customDate} onChange={setCustomDate} label="DATE" />
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No public events in {activeCity} for this range.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => {
              const conflict = conflictFor(e.date);
              const vibe = e.vibe_category?.trim();
              return (
                <Card key={e.id} className="glass">
                  <CardContent className="p-3 flex gap-3 items-start">
                    <div className="h-14 w-14 rounded-lg bg-secondary overflow-hidden shrink-0">
                      {e.image_url ? (
                        <img src={e.image_url} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl opacity-40">✦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate flex-1">{e.name}</h3>
                        {e.date && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(parseISO(e.date), "EEE MMM d")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {e.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto shrink-0">
                          <Users className="h-3 w-3" /> {e.going}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {vibe && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {vibe}
                          </span>
                        )}
                        {conflict && <ConflictBadge withEventName={conflict} />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default City;
