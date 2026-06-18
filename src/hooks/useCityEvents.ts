import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CityEvent {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  vibe_category: string | null;
  image_url: string | null;
  created_by: string;
  going: number;
}

export const useCityEvents = (city: string | null | undefined, from: string, to: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizer-city-events", city, from, to, user?.id],
    enabled: !!city && !!user,
    queryFn: async (): Promise<CityEvent[]> => {
      const { data: events, error } = await supabase
        .from("events")
        .select("id,name,date,time,location,city,vibe_category,image_url,created_by")
        .eq("visibility", "public")
        .ilike("city", `%${city}%`)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });
      if (error) throw error;
      const ids = (events ?? []).map((e) => e.id);
      const { data: atts } = ids.length
        ? await supabase.from("attendees").select("event_id,status").in("event_id", ids)
        : { data: [] };
      return (events ?? [])
        .filter((e) => e.created_by !== user!.id)
        .map((e: any) => ({
          ...e,
          going: (atts ?? []).filter((a: any) => a.event_id === e.id && a.status === "going").length,
        }));
    },
  });
};
