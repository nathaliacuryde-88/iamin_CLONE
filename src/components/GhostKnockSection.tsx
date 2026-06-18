import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ghost, Check, X, Lock } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";

type Knock = {
  id: string;
  knocker_id: string;
  status: "pending" | "revealed" | "ignored";
  profile?: { display_name: string | null; avatar_url: string | null } | null;
};

interface Props {
  eventId: string;
  isOwner: boolean;
  visibility: string;
}

/**
 * Knock section for ghost (tentative) and list-only (private) events.
 * - Non-owner: shows a Knock / Ask-to-join button.
 * - Owner: lists pending knocks with Reveal/Ignore actions.
 */
const GhostKnockSection = ({ eventId, isOwner, visibility }: Props) => {
  const { user } = useAuth();
  const haptic = useHaptics();
  const qc = useQueryClient();

  const isGhost = visibility === "tentative";
  const isList = visibility === "private";
  const isKnockable = isGhost || isList;

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
      return (data ?? null) as { id: string; status: Knock["status"] } | null;
    },
    enabled: isKnockable && !isOwner && !!user,
  });

  const { data: hostKnocks } = useQuery({
    queryKey: ["host-knocks", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_knocks")
        .select("id, knocker_id, status")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Knock[];
      const ids = list.map((k) => k.knocker_id);
      if (ids.length === 0) return list;
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      return list.map((k) => ({
        ...k,
        profile: profs?.find((p) => p.user_id === k.knocker_id) ?? null,
      }));
    },
    enabled: isKnockable && isOwner,
  });

  if (!isKnockable) return null;

  const knock = async () => {
    if (!user) return;
    haptic("medium");
    // Look up the event host so we can also send a follow if they're not yet
    // mutual friends (knock RLS requires mutual follow).
    const { data: ev } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();
    const hostId = (ev as any)?.created_by as string | undefined;

    const { error } = await supabase
      .from("event_knocks")
      .insert({ event_id: eventId, knocker_id: user.id });

    if (error) {
      // Not mutual friends yet — send a follow request so the host sees you,
      // then they can accept and you'll be able to ask to join.
      if (hostId && hostId !== user.id) {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: hostId });
        toast.success("Friend request sent — you can ask to join once they accept ✨");
      } else {
        toast.error("Couldn't send the request — try again.");
      }
      qc.invalidateQueries({ queryKey: ["my-knock", eventId, user.id] });
      return;
    }
    toast.success(isList ? "Request sent ✨" : "Knock sent 👻");
    qc.invalidateQueries({ queryKey: ["my-knock", eventId, user.id] });
  };

  const decide = async (id: string, status: "revealed" | "ignored") => {
    haptic("light");
    const { error } = await supabase
      .from("event_knocks")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't update — try again.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["host-knocks", eventId] });
  };

  const Icon = isList ? Lock : Ghost;
  const title = isList ? "Invite-only event" : "Ghost event";
  const ctaLabel = isList ? "Ask to join" : "👻 Knock";
  const emptyHint = isList
    ? "Ask the host to add you to the list."
    : "Knock once to ask the host what's going on.";
  const pendingHint = isList
    ? "Request sent — waiting for the host."
    : "Knock sent — waiting for the host.";
  const revealedHint = isList
    ? "Host added you to the list."
    : "Host revealed it to you.";
  const ignoredHint = "👻 They're busy. That's all you're getting.";

  // Non-owner UI
  if (!isOwner) {
    return (
      <Card className="tactile-widget">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">
              {myKnock?.status === "pending" && pendingHint}
              {myKnock?.status === "revealed" && revealedHint}
              {myKnock?.status === "ignored" && ignoredHint}
              {!myKnock && emptyHint}
            </p>
          </div>
          {!myKnock && (
            <Button size="sm" onClick={knock}>{ctaLabel}</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Owner UI
  const pending = (hostKnocks ?? []).filter((k) => k.status === "pending");
  if (pending.length === 0) return null;

  return (
    <Card className="tactile-widget">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <p className="text-sm font-medium">
            {isList ? "Join requests" : "Knocks"} ({pending.length})
          </p>
        </div>
        <div className="space-y-2">
          {pending.map((k) => (
            <div key={k.id} className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={k.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {k.profile?.display_name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm flex-1 truncate">
                {k.profile?.display_name ?? "Friend"}
              </span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => decide(k.id, "revealed")} aria-label="Accept">
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => decide(k.id, "ignored")} aria-label="Ignore">
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GhostKnockSection;
