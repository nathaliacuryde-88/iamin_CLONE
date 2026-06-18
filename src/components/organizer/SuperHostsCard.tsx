import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Crown } from "lucide-react";

interface Props {
  eventIds: string[];
  organizerId: string;
  nextEventId: string | null;
}

interface Hero {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  count: number;
}

const SuperHostsCard = ({ eventIds, organizerId, nextEventId }: Props) => {
  const { data, refetch } = useQuery({
    queryKey: ["super-hosts", eventIds.sort().join(",")],
    enabled: eventIds.length > 0,
    queryFn: async (): Promise<Hero[]> => {
      const { data: rows } = await supabase
        .from("attendees")
        .select("user_id, profiles:user_id(display_name, avatar_url)")
        .in("event_id", eventIds)
        .eq("status", "going");
      const byUser: Record<string, Hero> = {};
      (rows as any[])?.forEach((r) => {
        if (r.user_id === organizerId) return;
        const u = byUser[r.user_id] ?? {
          user_id: r.user_id,
          display_name: r.profiles?.display_name ?? null,
          avatar_url: r.profiles?.avatar_url ?? null,
          count: 0,
        };
        u.count += 1;
        byUser[r.user_id] = u;
      });
      return Object.values(byUser)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  const comp = async (userId: string, name: string | null) => {
    if (!nextEventId) {
      toast.error("Create an upcoming event first");
      return;
    }
    const { error: insErr } = await supabase
      .from("attendees")
      .upsert(
        { event_id: nextEventId, user_id: userId, status: "going", comped: true },
        { onConflict: "event_id,user_id" },
      );
    if (insErr) {
      toast.error("Couldn't comp them");
      return;
    }
    await supabase.from("notifications").insert({
      recipient_id: userId,
      sender_id: organizerId,
      type: "comped",
      event_id: nextEventId,
      content: "You're on the list — comped for the next one 👑",
    });
    toast.success(`${name ?? "They"} are on the guest list`);
    refetch();
  };

  const rows = data ?? [];

  return (
    <Card className="glass">
      <CardContent className="p-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Your super-hosts
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Reward the people who keep showing up
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No repeat guests yet.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((u, i) => (
              <div
                key={u.user_id}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-2.5"
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback>{u.display_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  {i === 0 && (
                    <Crown className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-yellow-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.display_name ?? "Someone"}</p>
                  <p className="text-[10px] text-muted-foreground">{u.count} events attended</p>
                </div>
                <Button size="sm" onClick={() => comp(u.user_id, u.display_name)}>
                  Comp
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperHostsCard;
