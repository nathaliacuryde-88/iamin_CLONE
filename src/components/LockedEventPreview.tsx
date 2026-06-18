import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Sparkles, UserPlus, Check, X, Clock3 } from "lucide-react";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { format } from "@/lib/dateFormat";
import { useDateLocale } from "@/lib/dateLocale";
import WeatherStrip from "@/components/WeatherStrip";
import AppLayout from "@/components/AppLayout";

const parseCoverMeta = (description: string | null | undefined) => {
  if (!description) return null;
  const m = description.match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  if (!m) return null;
  return { emoji: m[1], color: m[2] };
};

export type EventPreview = {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  description: string | null;
  vibe_category: string | null;
  visibility: string;
  created_by: string;
  host: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    account_type: string | null;
  } | null;
};

const LockedEventPreview = ({ preview, onClose }: { preview: EventPreview; onClose: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const haptic = useHaptics();
  const queryClient = useQueryClient();
  const dateLocale = useDateLocale();
  const navigate = useNavigate();

  const host = preview.host;
  const hostName = host?.display_name || host?.username || "Someone";
  const cover = !preview.image_url ? parseCoverMeta(preview.description) : null;

  // Friendship / follow status
  const { data: status, refetch } = useQuery({
    queryKey: ["preview-friend-status", preview.created_by, user?.id],
    queryFn: async () => {
      if (!user || user.id === preview.created_by) return null;
      const [{ data: a }, { data: b }, { data: req }] = await Promise.all([
        supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", preview.created_by).maybeSingle(),
        supabase.from("follows").select("id").eq("follower_id", preview.created_by).eq("following_id", user.id).maybeSingle(),
        supabase.from("friend_requests" as any).select("id, requester_id, status")
          .or(`and(requester_id.eq.${user.id},recipient_id.eq.${preview.created_by}),and(requester_id.eq.${preview.created_by},recipient_id.eq.${user.id})`)
          .eq("status", "pending")
          .maybeSingle(),
      ]);
      return {
        following: !!a,
        followsMe: !!b,
        pendingOutgoing: !!req && (req as any).requester_id === user.id,
        pendingIncoming: !!req && (req as any).requester_id === preview.created_by,
      };
    },
    enabled: !!user && user.id !== preview.created_by,
  });

  const isOrganizer = host?.account_type === "organizer";

  const handleConnect = async () => {
    if (!user || user.id === preview.created_by) return;
    haptic("medium");
    if (isOrganizer) {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: preview.created_by });
      toast({ title: `Following ${hostName}` });
    } else {
      const { error } = await supabase.from("friend_requests" as any).insert({
        requester_id: user.id,
        recipient_id: preview.created_by,
      });
      if (error) {
        toast({ title: "Couldn't send request", description: error.message, variant: "destructive" });
        return;
      }
      const { data: me } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
      await supabase.from("notifications").insert({
        recipient_id: preview.created_by,
        sender_id: user.id,
        type: "friend_request",
        content: `${me?.display_name ?? "Someone"} wants to be friends`,
      });
      toast({ title: "Friend request sent" });
    }
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["event", preview.id] });
  };

  const connected = status?.following || status?.pendingOutgoing;
  const ctaLabel = !user
    ? "Sign in to connect"
    : isOrganizer
    ? status?.following ? "Following" : `Follow ${hostName.split(" ")[0]}`
    : status?.pendingOutgoing
    ? "Request sent"
    : status?.pendingIncoming
    ? "Accept request"
    : `Add ${hostName.split(" ")[0]} as friend`;

  return (
    <AppLayout>
      <div
        className="max-w-2xl mx-auto relative"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        {/* Close */}
        <div
          className="absolute right-3 z-30"
          style={{ top: "calc(env(safe-area-inset-top) + 50px)" }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 backdrop-blur-xl border border-primary/30 hover:bg-primary/35 text-white shadow-[0_0_18px_-2px_rgba(124,58,237,0.55)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hero */}
        <div
          className="relative w-screen left-1/2 -translate-x-1/2 h-[42vh] max-h-[360px] min-h-[280px] overflow-hidden bg-muted/30"
          style={cover ? { background: `hsl(${cover.color})` } : undefined}
        >
          {preview.image_url ? (
            <img
              src={preview.image_url}
              alt={preview.name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : cover ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[7rem] leading-none drop-shadow-md">{cover.emoji}</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
        </div>

        <div className="space-y-4 px-4 -mt-6 relative z-10">
          {/* Vibe / name */}
          <div className="space-y-2">
            {preview.vibe_category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20 uppercase tracking-wider">
                {preview.vibe_category}
              </span>
            )}
            <h1 className="text-2xl font-bold leading-tight">{preview.name}</h1>
          </div>

          {/* Date / location quick row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {preview.date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(parseISO(preview.date), "EEE, d MMM", { locale: dateLocale })}
                {preview.time && <span className="inline-flex items-center gap-1 ml-1"><Clock3 className="h-3.5 w-3.5" /> {preview.time.slice(0, 5)}</span>}
              </span>
            )}
            {(preview.location || preview.city) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {preview.location || preview.city}
              </span>
            )}
          </div>

          {/* Weather */}
          {preview.date && (preview.city || preview.lat) && (
            <WeatherStrip
              city={preview.city}
              date={preview.date}
              time={preview.time}
              lat={preview.lat}
              lng={preview.lng}
            />
          )}

          {/* Host card */}
          {host && (
            <Link
              to={`/profile/${host.user_id}`}
              className="flex items-center gap-3 p-3 rounded-2xl card-surface hover:bg-secondary/40 transition-colors"
            >
              <Avatar className="h-12 w-12 border border-border">
                {host.avatar_url && <AvatarImage src={host.avatar_url} alt={hostName} />}
                <AvatarFallback {...avatarFallbackProps(hostName)}>{hostName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Hosted by</p>
                <p className="font-semibold truncate">{hostName}</p>
                {host.username && <p className="text-xs text-muted-foreground truncate">@{host.username}</p>}
              </div>
            </Link>
          )}

          {/* Locked CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl card-surface p-6 text-center space-y-3 border border-primary/20"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.1, 1.1, 1.05, 1.05, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
              className="text-5xl inline-block"
              aria-hidden
            >
              ✨
            </motion.div>
            <h2 className="text-lg font-bold">{hostName} keeps this one close</h2>
            <p className="text-sm text-muted-foreground">
              This event was created by <span className="text-foreground font-medium">{hostName}</span> for {isOrganizer ? "followers" : "her inner circle"}. Connect to see the full details, who's going, and join in.
            </p>
            <div className="pt-1">
              {user && user.id !== preview.created_by ? (
                <Button
                  size="lg"
                  className="w-full glow-sm"
                  disabled={!!connected}
                  onClick={handleConnect}
                >
                  {connected ? <Check className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {ctaLabel}
                </Button>
              ) : !user ? (
                <Button size="lg" className="w-full glow-sm" onClick={() => navigate("/auth")}>
                  <Sparkles className="h-4 w-4 mr-2" /> Sign in to connect
                </Button>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LockedEventPreview;
