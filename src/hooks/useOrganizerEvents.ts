import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type OrganizerEvent = {
  id: string;
  name: string;
  date: string | null;
  end_date: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  image_url: string | null;
  description: string | null;
  vibe_category: string | null;
  visibility: string;
  capacity: number | null;
  ticket_price_cents: number | null;
  ticket_currency: string | null;
  created_by: string;
  going: number;
  maybe: number;
  today_confirms: number;
};

export const useOrganizerEvents = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizer-events", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<OrganizerEvent[]> => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      const ids = (events ?? []).map((e) => e.id);
      const { data: atts } = ids.length
        ? await supabase.from("attendees").select("event_id,status,created_at").in("event_id", ids)
        : { data: [] };
      const today = new Date().toISOString().slice(0, 10);
      return (events ?? []).map((e: any) => {
        const list = (atts ?? []).filter((a: any) => a.event_id === e.id);
        return {
          ...e,
          going: list.filter((a: any) => a.status === "going").length,
          maybe: list.filter((a: any) => a.status === "interested").length,
          today_confirms: list.filter(
            (a: any) => a.status === "going" && a.created_at?.slice(0, 10) === today,
          ).length,
        } as OrganizerEvent;
      });
    },
  });
};
