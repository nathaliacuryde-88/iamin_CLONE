import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendIds } from "@/hooks/useFriendIds";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Search, UserPlus } from "lucide-react";

type Friend = { user_id: string; display_name: string | null; avatar_url: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export default function InvitePeopleSheet({ open, onOpenChange, eventId }: Props) {
  const { user } = useAuth();
  const { data: friendIds = [] } = useFriendIds();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: profs }, { data: invites }] = await Promise.all([
        friendIds.length
          ? supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", friendIds)
          : Promise.resolve({ data: [] as Friend[] }),
        supabase.from("event_invites").select("invitee_id").eq("event_id", eventId),
      ]);
      if (cancelled) return;
      setFriends((profs as Friend[]) ?? []);
      setInvited(new Set((invites ?? []).map((r: any) => r.invitee_id)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, eventId, friendIds.join(",")]);

  const toggleInvite = async (friendId: string) => {
    if (!user) return;
    setBusyId(friendId);
    try {
      if (invited.has(friendId)) {
        const { error } = await supabase
          .from("event_invites")
          .delete()
          .eq("event_id", eventId)
          .eq("invitee_id", friendId);
        if (error) throw error;
        setInvited((prev) => {
          const next = new Set(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from("event_invites")
          .insert({ event_id: eventId, invitee_id: friendId, inviter_id: user.id });
        if (error) throw error;
        setInvited((prev) => new Set(prev).add(friendId));
      }
    } catch (err: any) {
      toast({ title: "Couldn't update invite", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = friends.filter((f) =>
    !search.trim() || (f.display_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const visibleIds = filtered.map((f) => f.user_id);
  const allVisibleInvited = visibleIds.length > 0 && visibleIds.every((id) => invited.has(id));

  const handleSelectAll = async () => {
    if (!user || visibleIds.length === 0) return;
    if (allVisibleInvited) {
      const ids = visibleIds.filter((id) => invited.has(id));
      const { error } = await supabase
        .from("event_invites")
        .delete()
        .eq("event_id", eventId)
        .in("invitee_id", ids);
      if (error) {
        toast({ title: "Couldn't clear invites", description: error.message, variant: "destructive" });
        return;
      }
      setInvited((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      const toInvite = visibleIds.filter((id) => !invited.has(id));
      const rows = toInvite.map((id) => ({ event_id: eventId, invitee_id: id, inviter_id: user.id }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("event_invites").insert(rows);
      if (error) {
        toast({ title: "Couldn't invite all", description: error.message, variant: "destructive" });
        return;
      }
      setInvited((prev) => {
        const next = new Set(prev);
        toInvite.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Invite friends
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Invited friends can see this event even though it's hidden from the feed.
          </p>
        </SheetHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends"
            className="pl-9"
          />
        </div>

        {filtered.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {invited.size} invited · {filtered.length} shown
            </p>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {allVisibleInvited ? "Clear all" : "Select all"}
            </button>
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              {friends.length === 0 ? "No friends yet — add some first!" : "No matches"}
            </p>
          ) : (
            filtered.map((f) => {
              const isInvited = invited.has(f.user_id);
              const isBusy = busyId === f.user_id;
              return (
                <button
                  key={f.user_id}
                  onClick={() => toggleInvite(f.user_id)}
                  disabled={isBusy}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={f.avatar_url ?? undefined} />
                    <AvatarFallback>{f.display_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {f.display_name ?? "User"}
                  </span>
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isInvited ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check className="h-3.5 w-3.5" /> Invited
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">Invite</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <Button
          className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 glow-sm"
          onClick={() => onOpenChange(false)}
        >
          Done
        </Button>
      </SheetContent>
    </Sheet>
  );
}
