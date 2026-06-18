import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendIds } from "@/hooks/useFriendIds";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Clock, Loader2, Search, UserPlus } from "lucide-react";

type Friend = { user_id: string; display_name: string | null; avatar_url: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

/**
 * Non-host flow: a friend can suggest people from their own friend list to be
 * invited to an event they don't own. The host gets a notification and can
 * approve/decline — only on approval does a real `event_invites` row get
 * created, so the suggested person never sees anything until then.
 */
export default function SuggestGuestSheet({ open, onOpenChange, eventId }: Props) {
  const { user } = useAuth();
  const { data: friendIds = [] } = useFriendIds();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [alreadyInvited, setAlreadyInvited] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: profs }, { data: suggestions }, { data: invites }] = await Promise.all([
        friendIds.length
          ? supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", friendIds)
          : Promise.resolve({ data: [] as Friend[] }),
        supabase
          .from("event_invite_suggestions" as any)
          .select("suggested_user_id, status")
          .eq("event_id", eventId)
          .eq("suggester_id", user.id),
        supabase.from("event_invites").select("invitee_id").eq("event_id", eventId),
      ]);
      if (cancelled) return;
      setFriends((profs as Friend[]) ?? []);
      setPending(
        new Set(
          ((suggestions ?? []) as any[])
            .filter((s) => s.status === "pending")
            .map((s) => s.suggested_user_id as string),
        ),
      );
      setAlreadyInvited(new Set(((invites ?? []) as any[]).map((r) => r.invitee_id as string)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, eventId, friendIds.join(","), user?.id]);

  const suggest = async (friendId: string) => {
    if (!user) return;
    setBusyId(friendId);
    try {
      const { error } = await supabase
        .from("event_invite_suggestions" as any)
        .insert({ event_id: eventId, suggester_id: user.id, suggested_user_id: friendId });
      if (error) throw error;
      setPending((prev) => new Set(prev).add(friendId));
      toast({ title: "Sent to host", description: "They'll approve or decline." });
    } catch (err: any) {
      toast({ title: "Couldn't suggest", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = friends.filter((f) =>
    !search.trim() || (f.display_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Suggest a guest
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Pick friends to suggest to the host. They'll get a notification and
            decide whether to invite them.
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
              const isPending = pending.has(f.user_id);
              const isInvited = alreadyInvited.has(f.user_id);
              const isBusy = busyId === f.user_id;
              return (
                <button
                  key={f.user_id}
                  onClick={() => !isPending && !isInvited && suggest(f.user_id)}
                  disabled={isBusy || isPending || isInvited}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left disabled:opacity-100"
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
                  ) : isPending ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">Suggest</span>
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
