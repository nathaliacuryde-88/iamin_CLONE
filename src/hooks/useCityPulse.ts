import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserLocation, distanceKm } from "@/hooks/useUserLocation";

export type GoingProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

/**
 * City Pulse — surfaces the most-RSVP'd public events happening soon,
 * scoped to the user's city (from profile) or nearby coordinates.
 * Returns up to 10 nearby public events ordered from soonest to later.
 */
export const useCityPulse = () => {
  const { user } = useAuth();
  const { location } = useUserLocation();

  return useQuery({
    queryKey: ["city-pulse", user?.id, location?.lat, location?.lng],
    queryFn: async () => {
      // Resolve user's city from profile
      let city: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .maybeSingle();
        city = profile?.city ?? null;
      }

      const today = new Date().toISOString().slice(0, 10);
      const next30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      let query = supabase
        .from("events")
        .select("*")
        .eq("visibility", "public")
        .gte("date", today)
        .lte("date", next30);

      if (city) query = query.ilike("city", `%${city}%`);

      const { data: events } = await query.limit(60);
      if (!events || events.length === 0) return [];

      // Distance fallback if no city match but we have geo
      let scoped = events;
      if (!city && location) {
        scoped = events.filter((e) => {
          if (typeof e.lat !== "number" || typeof e.lng !== "number") return false;
          return distanceKm(location, { lat: e.lat, lng: e.lng }) <= 50;
        });
      }
      if (scoped.length === 0) return [];

      const ids = scoped.map((e) => e.id);
      const { data: attendees } = await supabase
        .from("attendees")
        .select("event_id, user_id, status")
        .in("event_id", ids);

      const goingByEvent = new Map<string, string[]>();
      (attendees ?? []).forEach((a) => {
        if (a.status !== "going") return;
        const arr = goingByEvent.get(a.event_id) ?? [];
        arr.push(a.user_id);
        goingByEvent.set(a.event_id, arr);
      });

      // Batch profile fetch for all "going" users
      const uniqueUserIds = Array.from(new Set(Array.from(goingByEvent.values()).flat()));
      const { data: profiles } = uniqueUserIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", uniqueUserIds)
        : { data: [] as GoingProfile[] };
      const profileMap = new Map<string, GoingProfile>();
      (profiles ?? []).forEach((p: any) => profileMap.set(p.user_id, p));

      return scoped
        .map((e) => {
          const goingIds = goingByEvent.get(e.id) ?? [];
          const going_profiles: GoingProfile[] = goingIds
            .map((uid) => profileMap.get(uid))
            .filter(Boolean) as GoingProfile[];
          return {
            ...e,
            going_count: goingIds.length,
            going_profiles: going_profiles.slice(0, 4),
            attendees: (attendees ?? []).filter((a) => a.event_id === e.id),
          };
        })
        .sort((a, b) => {
          const dateDiff = (a.date ?? "9999").localeCompare(b.date ?? "9999");
          if (dateDiff !== 0) return dateDiff;
          const timeDiff = (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
          if (timeDiff !== 0) return timeDiff;
          return b.going_count - a.going_count;
        })
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};
