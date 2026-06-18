import { useEffect, useMemo, useState } from "react";
import { Bell, Check, X, UserPlus, Mail, Euro, Pencil, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

type Notification = Tables<"notifications">;
type Profile = Tables<"profiles">;

type BadgeKind = "invite" | "money" | "rsvp" | "tab" | "reminder" | "follow" | "generic";

const typeMeta = (type: string | null): { kind: BadgeKind } => {
  switch (type) {
    case "friend_request":
    case "invite_suggestion":
    case "cohost_request":
    case "event_invite":
    case "invite":
      return { kind: "invite" };
    case "new_follower":
      return { kind: "follow" };
    case "tab_settled":
    case "paid_you":
    case "payment_received":
      return { kind: "money" };
    case "rsvp":
    case "event_attendee":
    case "going":
      return { kind: "rsvp" };
    case "tab_added":
    case "tab_updated":
    case "expense_added":
      return { kind: "tab" };
    case "reminder":
    case "payment_reminder":
      return { kind: "reminder" };
    default:
      return { kind: "generic" };
  }
};

const AvatarBadge = ({ kind }: { kind: BadgeKind }) => {
  const map: Record<BadgeKind, { bg: string; icon: React.ReactNode }> = {
    invite: { bg: "bg-primary text-primary-foreground", icon: <Mail className="h-3 w-3" /> },
    money: { bg: "bg-emerald-500 text-white", icon: <Euro className="h-3 w-3" strokeWidth={3} /> },
    rsvp: { bg: "bg-emerald-500 text-white", icon: <Check className="h-3 w-3" strokeWidth={3} /> },
    tab: { bg: "bg-slate-500 text-white", icon: <Pencil className="h-3 w-3" /> },
    reminder: { bg: "bg-amber-500 text-white", icon: <BellRing className="h-3 w-3" /> },
    follow: { bg: "bg-primary text-primary-foreground", icon: <UserPlus className="h-3 w-3" /> },
    generic: { bg: "bg-muted text-muted-foreground", icon: <Bell className="h-3 w-3" /> },
  };
  const m = map[kind];
  return (
    <span className={cn(
      "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-background",
      m.bg,
    )}>
      {m.icon}
    </span>
  );
};

// Render text and replace any money token (e.g. "5,00 €" / "5.00 €" / "€5") with a chip
const renderContentWithChips = (text: string, tone: "green" | "amber" | "neutral") => {
  const re = /(\d+[.,]\d{2}\s?€|€\s?\d+[.,]\d{2}|\$\d+(?:[.,]\d{2})?)/g;
  const parts = text.split(re);
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/15 text-emerald-500"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-500"
        : "bg-muted text-foreground";
  return parts.map((p, i) =>
    re.test(p) ? (
      <span
        key={i}
        className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold mx-0.5 align-middle", toneClass)}
      >
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
};

const NotificationsBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const haptic = useHaptics();
  const [items, setItems] = useState<Notification[]>([]);
  const [senders, setSenders] = useState<Record<string, Profile>>({});
  const [requests, setRequests] = useState<Record<string, { id: string; status: string }>>({});
  const [followingBack, setFollowingBack] = useState<Set<string>>(new Set());
  const [rsvped, setRsvped] = useState<Record<string, string>>({}); // event_id -> status
  const [inviteEvents, setInviteEvents] = useState<Record<string, string>>({}); // event_id -> name
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.read).length;

  const load = async () => {
    if (!user) return;
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const raw = notifs ?? [];
    const seen = new Set<string>();
    const list: Notification[] = [];
    for (const n of raw) {
      const dedupeTypes = new Set(["new_follower", "friend_request"]);
      if (n.sender_id && dedupeTypes.has(n.type as string)) {
        const key = `${n.type}:${n.sender_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      list.push(n);
    }
    setItems(list);

    const duplicateIds = raw.filter((n) => !list.find((x) => x.id === n.id)).map((n) => n.id);
    if (duplicateIds.length) {
      supabase.from("notifications").delete().in("id", duplicateIds).then(() => {});
    }

    const senderIds = Array.from(new Set(list.map((n) => n.sender_id).filter(Boolean) as string[]));
    if (senderIds.length) {
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", senderIds);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p) => { map[p.user_id] = p; });
      setSenders(map);
    }

    const friendNotifs = list.filter((n) => n.type === "friend_request" && n.sender_id);
    if (friendNotifs.length) {
      const { data: reqs } = await supabase
        .from("friend_requests" as any)
        .select("id, requester_id, status")
        .eq("recipient_id", user.id)
        .in("requester_id", friendNotifs.map((n) => n.sender_id!));
      const rmap: Record<string, { id: string; status: string }> = {};
      ((reqs ?? []) as any[]).forEach((r) => { rmap[r.requester_id] = { id: r.id, status: r.status }; });
      setRequests(rmap);
    }

    const followerIds = Array.from(new Set(
      list.filter((n) => n.type === "new_follower" && n.sender_id).map((n) => n.sender_id!),
    ));
    if (followerIds.length) {
      const { data: fb } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", followerIds);
      setFollowingBack(new Set((fb ?? []).map((f) => f.following_id)));
    }

    const inviteEventIds = Array.from(new Set(
      list.filter((n) => typeMeta(n.type).kind === "invite" && (n as any).event_id).map((n) => (n as any).event_id as string),
    ));
    if (inviteEventIds.length) {
      const { data: att } = await supabase
        .from("attendees")
        .select("event_id, status")
        .eq("user_id", user.id)
        .in("event_id", inviteEventIds);
      const m: Record<string, string> = {};
      ((att ?? []) as any[]).forEach((a) => { m[a.event_id] = a.status; });
      setRsvped(m);

      const { data: evs } = await supabase
        .from("events")
        .select("id, name")
        .in("id", inviteEventIds);
      const em: Record<string, string> = {};
      ((evs ?? []) as any[]).forEach((e) => { em[e.id] = e.name; });
      setInviteEvents(em);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev]);
          load();
          // Enrich live banner: emoji per type + bold event name when available.
          const emojiFor = (type: string | null) => {
            switch (type) {
              case "event_invite":
              case "invite_suggestion":
              case "cohost_request":
                return "💌";
              case "friend_request": return "👋";
              case "new_follower": return "✨";
              case "event_rsvp_accepted": return "✅";
              case "tab_settled":
              case "paid_you":
              case "payment_received": return "💸";
              case "tab_added":
              case "tab_updated":
              case "expense_added": return "🧾";
              case "reminder":
              case "payment_reminder": return "⏰";
              case "birthday_card": return "🎂";
              case "ghost_knock":
              case "ghost_revealed":
              case "ghost_ignored": return "👻";
              case "pact_proposed":
              case "pact_sealed": return "🤝";
              case "line_walk_in": return "🟢";
              case "duplicate_event": return "🔁";
              default: return "🔔";
            }
          };
          let eventName: string | null = null;
          const eventId = (n as any).event_id as string | null;
          if (eventId) {
            const { data: ev } = await supabase.from("events").select("name").eq("id", eventId).maybeSingle();
            eventName = ev?.name ?? null;
          }
          let senderName: string | null = null;
          if (n.sender_id) {
            const { data: p } = await supabase.from("profiles").select("display_name").eq("user_id", n.sender_id).maybeSingle();
            senderName = p?.display_name ?? null;
          }
          const baseContent = n.content ?? "New notification";
          toast.custom((id) => (
            <div
              onClick={() => { toast.dismiss(id); setOpen(true); }}
              className="pointer-events-auto cursor-pointer w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-background/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.45)] px-4 py-3 flex items-start gap-3"
            >
              <span className="text-xl leading-none mt-0.5" aria-hidden>{emojiFor(n.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-foreground">
                  {senderName && <span className="font-semibold">{senderName} </span>}
                  <span className="text-foreground/90">{baseContent}</span>
                  {eventName && (
                    <>
                      {" "}<span className="font-semibold text-primary">{eventName}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          ));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const clearAll = async () => {
    if (!user || items.length === 0) return;
    haptic("light");
    await supabase.from("notifications").delete().eq("recipient_id", user.id);
    setItems([]);
  };

  const markOneRead = async (n: Notification) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
  };

  const respondRequest = async (notif: Notification, accept: boolean) => {
    const req = notif.sender_id ? requests[notif.sender_id] : null;
    if (!req) { haptic("error"); toast.error("Request no longer available"); return; }
    haptic(accept ? "success" : "light");
    const { error } = await supabase
      .from("friend_requests" as any)
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", req.id);
    if (error) { haptic("error"); toast.error(error.message); return; }
    toast(accept ? "You're now friends!" : "Request declined");
    setRequests((prev) => ({ ...prev, [notif.sender_id!]: { ...req, status: accept ? "accepted" : "declined" } }));
    queryClient.invalidateQueries({ queryKey: ["friend-status"] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  const followBack = async (senderId: string) => {
    if (!user) return;
    haptic("success");
    const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: senderId });
    if (error) { haptic("error"); toast.error(error.message); return; }
    setFollowingBack((prev) => new Set(prev).add(senderId));
    toast("Following back");
    queryClient.invalidateQueries({ queryKey: ["my-following"] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
  };

  const inviteRsvp = async (n: Notification, going: boolean) => {
    if (!user || !(n as any).event_id) return;
    const eventId = (n as any).event_id as string;
    haptic(going ? "success" : "light");
    const status = going ? "going" : "interested";
    const { error } = await supabase
      .from("attendees")
      .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
    if (error) { haptic("error"); toast.error(error.message); return; }
    setRsvped((prev) => ({ ...prev, [eventId]: status }));
    markOneRead(n);
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast(going ? "You're in" : "Marked as maybe");
  };

  const { groupNew, groupEarlier } = useMemo(() => {
    const a: Notification[] = [];
    const b: Notification[] = [];
    items.forEach((n) => (n.read ? b : a).push(n));
    return { groupNew: a, groupEarlier: b };
  }, [items]);

  const renderItem = (n: Notification) => {
    const sender = n.sender_id ? senders[n.sender_id] : null;
    const meta = typeMeta(n.type);
    const eventId = (n as any).event_id as string | null;

    const avatar = (
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={sender?.avatar_url ?? undefined} />
          <AvatarFallback className="text-sm bg-primary/15 text-primary font-semibold">
            {sender?.display_name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
        <AvatarBadge kind={meta.kind} />
      </div>
    );

    const goToProfile = () => {
      if (n.sender_id) { setOpen(false); navigate(`/profile/${n.sender_id}`); }
    };
    const goToEvent = () => {
      if (eventId) { setOpen(false); navigate(`/event/${eventId}`); }
    };

    const tone: "green" | "amber" | "neutral" =
      meta.kind === "money" || meta.kind === "rsvp" ? "green" : meta.kind === "reminder" ? "amber" : "neutral";

    // Body content
    let body: React.ReactNode;
    let actions: React.ReactNode = null;

    if (n.type === "friend_request") {
      const alreadyFollowing = n.sender_id ? followingBack.has(n.sender_id) : false;
      body = (
        <p className="text-[13px] text-foreground leading-snug">
          <button onClick={goToProfile} className="font-semibold hover:text-primary">
            {sender?.display_name ?? "Someone"}
          </button>{" "}
          wants to be friends
        </p>
      );
      actions = (
        <div className="flex gap-2 mt-2">
          {alreadyFollowing ? (
            <span className="text-[11px] text-muted-foreground italic">Following back</span>
          ) : (
            <Button size="sm" className="h-8 px-3 rounded-full text-xs" onClick={() => n.sender_id && followBack(n.sender_id)}>Follow back</Button>
          )}
        </div>
      );
    } else if (n.type === "new_follower" && n.sender_id) {
      const alreadyFollowing = followingBack.has(n.sender_id);
      body = (
        <p className="text-[13px] text-foreground leading-snug">
          <button onClick={goToProfile} className="font-semibold hover:text-primary">
            {sender?.display_name ?? "Someone"}
          </button>{" "}
          started following you
        </p>
      );
      actions = (
        <div className="flex gap-2 mt-2">
          {alreadyFollowing ? (
            <span className="text-[11px] text-muted-foreground italic">Following back</span>
          ) : (
            <Button size="sm" className="h-8 px-3 rounded-full text-xs" onClick={() => followBack(n.sender_id!)}>Follow back</Button>
          )}
        </div>
      );
    } else if (meta.kind === "invite" && eventId) {
      const status = rsvped[eventId];
      const eventName = inviteEvents[eventId];
      body = (
        <p className="text-[13px] text-foreground leading-snug">
          <button onClick={goToProfile} className="font-semibold hover:text-primary">
            {sender?.display_name ?? "Someone"}
          </button>{" "}
          invited you to{" "}
          <button onClick={goToEvent} className="font-semibold text-primary hover:underline">
            {eventName ?? "an event"}
          </button>
        </p>
      );
      if (!status) {
        actions = (
          <div className="flex gap-2 mt-2">
            <Button size="sm" className="h-8 px-4 rounded-full text-xs" onClick={() => inviteRsvp(n, true)}>I'm in</Button>
            <Button size="sm" variant="outline" className="h-8 px-3 rounded-full text-xs" onClick={() => inviteRsvp(n, false)}>Maybe</Button>
          </div>
        );
      } else {
        actions = (
          <p className="text-[11px] text-muted-foreground italic mt-1">
            {status === "going" ? "You're in" : status === "interested" ? "Maybe" : status === "declined" ? "Declined" : status}
          </p>
        );
      }
    } else if (meta.kind === "reminder" && eventId) {
      body = (
        <p className="text-[13px] text-foreground leading-snug">
          {renderContentWithChips(n.content ?? "Reminder", "amber")}
        </p>
      );
      actions = (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" className="h-8 px-3 rounded-full text-xs" onClick={goToEvent}>Settle up</Button>
        </div>
      );
    } else {
      body = (
        <p className="text-[13px] text-foreground leading-snug">
          {renderContentWithChips(n.content ?? "", tone)}
        </p>
      );
    }

    const rowClick = () => {
      markOneRead(n);
      if (eventId) goToEvent();
      else if (n.sender_id) goToProfile();
    };

    return (
      <div
        key={n.id}
        onClick={rowClick}
        className="relative flex items-start gap-3 p-3 rounded-2xl bg-foreground/[0.03] dark:bg-white/[0.03] active:bg-foreground/[0.06] transition-colors cursor-pointer"
      >
        <button onClick={(e) => { e.stopPropagation(); goToProfile(); }}>{avatar}</button>
        <div className="flex-1 min-w-0">
          {body}
          <p className="text-[11px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
          </p>
          {actions}
        </div>
        {!n.read && (
          <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { setOpen(o); if (o) haptic("light"); }}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Notifications"
          className="h-9 w-9 rounded-full text-foreground hover:text-foreground hover:bg-white/[0.06] relative"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] h-[85dvh]">
        <div className="mx-auto w-full max-w-2xl flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="flex items-center justify-between pt-2 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <DrawerTitle className="text-2xl font-bold">Notifications</DrawerTitle>
              {unread > 0 && (
                <span className="text-[11px] font-medium text-primary px-2.5 py-0.5 rounded-full border border-primary/40">
                  {unread} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAll}
              disabled={items.length === 0}
              className={cn(
                "text-sm font-medium transition-colors",
                items.length > 0 ? "text-primary hover:text-primary/80" : "text-muted-foreground/50",
              )}
            >
              Clear all
            </button>
          </div>


          <div className="overflow-y-auto -mx-1 px-1 space-y-4 flex-1 min-h-0 pb-4">
            {items.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">You're all caught up</div>
            )}
            {groupNew.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2 px-1">New</p>
                <div className="space-y-2">{groupNew.map(renderItem)}</div>
              </div>
            )}
            {groupEarlier.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2 px-1">Earlier</p>
                <div className="space-y-2">{groupEarlier.map(renderItem)}</div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationsBell;
