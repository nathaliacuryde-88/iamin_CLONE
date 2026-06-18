import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNowStrict, subWeeks } from "date-fns";

interface Props {
  eventIds: string[];
  organizerId: string;
}

interface Regular {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_attended: string;
  attended_count: number;
}

const SlippingAwayCard = ({ eventIds, organizerId }: Props) => {
  const { data, refetch } = useQuery({
    queryKey: ["slipping-away", eventIds.sort().join(",")],
    enabled: eventIds.length > 0,
    queryFn: async (): Promise<Regular[]> => {
      const { data: rows } = await supabase
        .from("attendees")
        .select("user_id, created_at, profiles:user_id(display_name, avatar_url)")
        .in("event_id", eventIds)
        .eq("status", "going");
      const byUser: Record<string, Regular> = {};
      (rows as any[])?.forEach((r) => {
        const u = byUser[r.user_id] ?? {
          user_id: r.user_id,
          display_name: r.profiles?.display_name ?? null,
          avatar_url: r.profiles?.avatar_url ?? null,
          last_attended: r.created_at,
          attended_count: 0,
        };
        u.attended_count += 1;
        if (new Date(r.created_at) > new Date(u.last_attended)) u.last_attended = r.created_at;
        byUser[r.user_id] = u;
      });
      const cutoff = subWeeks(new Date(), 3);
      return Object.values(byUser)
        .filter((u) => u.user_id !== organizerId && u.attended_count >= 3 && new Date(u.last_attended) < cutoff)
        .sort((a, b) => new Date(a.last_attended).getTime() - new Date(b.last_attended).getTime())
        .slice(0, 5);
    },
  });

  const winBack = async (userId: string, name: string | null) => {
    const { error } = await supabase.from("notifications").insert({
      recipient_id: userId,
      sender_id: organizerId,
      type: "win_back",
      content: "We miss you — come back soon 💔",
    });
    if (error) {
      toast.error("Couldn't send — you may need to be mutuals first");
      return;
    }
    toast.success(`Sent a win-back to ${name ?? "them"}`);
    refetch();
  };

  const rows = data ?? [];

  return (
    <Card className="glass">
      <CardContent className="p-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Slipping away
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Regulars who haven't been in a while
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No regulars to win back yet.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-2.5"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback>{u.display_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.display_name ?? "Someone"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {u.attended_count}× · last {formatDistanceToNowStrict(new Date(u.last_attended))} ago
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => winBack(u.user_id, u.display_name)}>
                  Win back
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlippingAwayCard;
