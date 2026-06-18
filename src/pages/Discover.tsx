import { useState, useEffect, useRef } from "react";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, UserMinus, Calendar, Tag, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
// CityPulse moved into main feed tabs; not used here anymore
import { format, parseISO } from "date-fns";
import RecommendedPeople from "@/components/RecommendedPeople";

const Discover = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
  }, [searchParams]);

  const term = search.trim();
  const enabled = !!user && term.length > 0;

  const { data: people } = useQuery({
    queryKey: ["search-people", term],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user!.id)
        .or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(10);
      return data ?? [];
    },
    enabled,
  });

  const { data: events } = useQuery({
    queryKey: ["search-events", term],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .eq("visibility", "public")
        .limit(10);
      return data ?? [];
    },
    enabled,
  });

  const { data: tagEvents } = useQuery({
    queryKey: ["search-tags", term],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .ilike("vibe_category", `%${term}%`)
        .eq("visibility", "public")
        .limit(10);
      return data ?? [];
    },
    enabled,
  });

  // Debounced natural-language AI search
  const [debouncedTerm, setDebouncedTerm] = useState(term);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(term), 450);
    return () => clearTimeout(id);
  }, [term]);

  const { data: aiEvents, isFetching: aiLoading } = useQuery({
    queryKey: ["ai-search", debouncedTerm],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-event-search", {
        body: { query: debouncedTerm },
      });
      if (error) throw error;
      const ids: string[] = data?.ids ?? [];
      if (ids.length === 0) return [];
      const { data: rows } = await supabase
        .from("events")
        .select("*")
        .in("id", ids);
      // preserve AI ranking order
      const map = new Map((rows ?? []).map((r: any) => [r.id, r]));
      return ids.map((id) => map.get(id)).filter(Boolean);
    },
    enabled: !!user && debouncedTerm.length >= 3,
    staleTime: 30_000,
  });

  const { data: followingIds } = useQuery({
    queryKey: ["my-following"],
    queryFn: async () => {
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", user!.id);
      return new Set(data?.map((f) => f.following_id) ?? []);
    },
    enabled: !!user,
  });

  const haptic = useHaptics();

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = followingIds?.has(targetUserId);
    haptic(isFollowing ? "light" : "medium");
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      // Notification is created by a DB trigger (notify_new_follower)
    }
    queryClient.invalidateQueries({ queryKey: ["my-following"] });
  };

  // Pull-to-refresh
  const scrollRef = useRef<HTMLDivElement>(null);
  const ptr = usePullToRefresh({
    containerRef: scrollRef,
    onRefresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["search-people"] }),
        queryClient.invalidateQueries({ queryKey: ["search-events"] }),
        queryClient.invalidateQueries({ queryKey: ["search-tags"] }),
        queryClient.invalidateQueries({ queryKey: ["my-following"] }),
      ]);
    },
  });

  const totalResults = (people?.length ?? 0) + (events?.length ?? 0) + (tagEvents?.length ?? 0);

  return (
    <AppLayout>
      <div
        ref={scrollRef}
        className="relative overflow-y-auto"
        style={{ height: "calc(100dvh - 3.5rem)" }}
      >
        <PullToRefreshIndicator {...ptr} />
        <div className="max-w-2xl mx-auto space-y-6 pt-[50px] md:pt-[60px] pb-32 md:pb-6 px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 dark:bg-white/[0.04] border border-border dark:border-white/10 px-3 h-12 backdrop-blur-xl">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder='Try "house music this weekend" or "chill rooftop"'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-0 px-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
              autoFocus
            />
          </div>

        {/* City Pulse moved into main feed tabs */}

        {!enabled && (
          <RecommendedPeople followingIds={followingIds} onToggleFollow={handleFollow} />
        )}

        {enabled && totalResults === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">No results for "{term}"</p>
        )}

        {/* People */}
        {enabled && people && people.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <UserPlus className="h-3 w-3" /> People
            </h3>
            {people.map((profile) => (
              <Card key={profile.id} className="glass hover:glow-sm transition-all">
                <CardContent className="p-3 flex items-center justify-between">
                  <Link to={`/profile/${profile.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback {...avatarFallbackProps(profile.display_name ?? profile.user_id)}>{profile.display_name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{profile.display_name ?? "User"}</p>
                      {profile.username && <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>}
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={followingIds?.has(profile.user_id) ? "outline" : "default"}
                    className={followingIds?.has(profile.user_id) ? "" : "glow-sm"}
                    onClick={() => handleFollow(profile.user_id)}
                  >
                    {followingIds?.has(profile.user_id) ? (
                      <><UserMinus className="h-3.5 w-3.5 mr-1" /> Unfollow</>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Events */}
        {enabled && events && events.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Events
            </h3>
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="glass hover:glow-sm transition-all">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/[0.06]">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover border-0 border-none" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg opacity-40">✦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.date ? format(parseISO(event.date), "MMM d, yyyy") : "TBD"}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* AI Smart matches */}
        {enabled && debouncedTerm.length >= 3 && (aiLoading || (aiEvents && aiEvents.length > 0)) && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> Smart matches
              {aiLoading && <span className="text-muted-foreground/60">· searching…</span>}
            </h3>
            {(aiEvents ?? []).map((event: any) => (
              <Link key={`ai-${event.id}`} to={`/event/${event.id}`}>
                <Card className="glass hover:glow-sm transition-all border-primary/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/[0.06]">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg opacity-40">✦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.date ? format(parseISO(event.date), "MMM d, yyyy") : "TBD"}
                        {event.vibe_category && ` · ${event.vibe_category}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}



        {/* Tags */}
        {enabled && tagEvents && tagEvents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Tagged "{term}"
            </h3>
            {tagEvents.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <Card className="glass hover:glow-sm transition-all">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.vibe_category}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Discover;
