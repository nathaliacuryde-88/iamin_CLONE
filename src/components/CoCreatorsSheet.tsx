import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendIds } from "@/hooks/useFriendIds";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Search, Users } from "lucide-react";

type Friend = { user_id: string; display_name: string | null; avatar_url: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export default function CoCreatorsSheet({ open, onOpenChange, eventId }: Props) {
  const { user } = useAuth();
  const { data: friendIds = [] } = useFriendIds();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [collaborators, setCollaborators] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: profs }, { data: existing }] = await Promise.all([
        friendIds.length
          ? supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", friendIds)
          : Promise.resolve({ data: [] as Friend[] }),
        supabase.from("event_collaborators" as any).select("user_id").eq("event_id", eventId),
      ]);
      if (cancelled) return;
      setFriends((profs as Friend[]) ?? []);
      setCollaborators(new Set(((existing ?? []) as any[]).map((r) => r.user_id)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, eventId, friendIds.join(",")]);

  const toggle = async (friendId: string) => {
    if (!user) return;
    setBusyId(friendId);
    try {
      if (collaborators.has(friendId)) {
        const { error } = await supabase
          .from("event_collaborators" as any)
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", friendId);
        if (error) throw error;
        setCollaborators((prev) => {
          const next = new Set(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from("event_collaborators" as any)
          .insert({ event_id: eventId, user_id: friendId, added_by: user.id });
        if (error) throw error;
        setCollaborators((prev) => new Set(prev).add(friendId));
      }
    } catch (err: any) {
      toast({ title: "Couldn't update co-creator", description: err.message, variant: "destructive" });
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
            <Users className="h-4 w-4 text-primary" /> Co-creators
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Co-creators can edit and manage this event with you.
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

        <div className="mt-4 space-y-1.5">
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
              const isOn = collaborators.has(f.user_id);
              const isBusy = busyId === f.user_id;
              return (
                <button
                  key={f.user_id}
                  onClick={() => toggle(f.user_id)}
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
                  ) : isOn ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check className="h-3.5 w-3.5" /> Co-creator
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">Add</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <Button
          className="w-full mt-4"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Done
        </Button>
      </SheetContent>
    </Sheet>
  );
}
