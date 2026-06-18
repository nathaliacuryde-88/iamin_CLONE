import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";
import { Zap } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  eventName: string;
  priceCents?: number | null;
}

const OFFERS = [
  { key: "free_entry_23", label: "Free entry before 23:00" },
  { key: "2for1_first_drink", label: "2-for-1 first drink" },
  { key: "skip_the_line", label: "Skip the line" },
  { key: "bring_a_friend", label: "Bring-a-friend, both free" },
];

const ConvertMaybesSheet = ({ open, onOpenChange, eventId, eventName, priceCents }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const haptic = useHaptics();
  const [offer, setOffer] = useState(OFFERS[0].key);
  const [sending, setSending] = useState(false);

  const { data: maybes = [] } = useQuery({
    queryKey: ["event-maybes", eventId],
    enabled: open,
    queryFn: async () => {
      const { data: atts } = await supabase
        .from("attendees")
        .select("user_id")
        .eq("event_id", eventId)
        .eq("status", "interested");
      const ids = (atts ?? []).map((a) => a.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,display_name,avatar_url")
        .in("user_id", ids);
      return (profs ?? []) as Array<{
        user_id: string;
        display_name: string | null;
        avatar_url: string | null;
      }>;
    },
  });

  const projectedRevenue = useMemo(() => {
    const price = (priceCents ?? 800) / 100;
    const convert = Math.round(maybes.length * 0.45);
    return { value: convert * price, count: convert };
  }, [maybes.length, priceCents]);

  const handleSend = async () => {
    if (!user || !maybes.length) return;
    setSending(true);
    haptic("medium");
    try {
      const offerLabel = OFFERS.find((o) => o.key === offer)?.label ?? offer;
      const perks = maybes.map((m) => ({
        event_id: eventId,
        recipient_id: m.user_id,
        offer_key: offer,
        sent_by: user.id,
      }));
      const notifs = maybes.map((m) => ({
        recipient_id: m.user_id,
        sender_id: user.id,
        type: "perk",
        event_id: eventId,
        content: `🎁 ${offerLabel} for ${eventName}`,
      }));
      await supabase.from("event_perks" as any).upsert(perks, {
        onConflict: "event_id,recipient_id,offer_key",
      });
      await supabase.from("notifications" as any).insert(notifs);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Perks sent to ${maybes.length} ${maybes.length === 1 ? "maybe" : "maybes"} ⚡`, {
        description: "Personal, not a blast",
      });
      haptic("success");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Couldn't send", { description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-center">
          <SheetTitle className="text-xl inline-flex items-center justify-center gap-2">
            Convert the maybes
            <Zap className="h-5 w-5 text-amber-400" />
          </SheetTitle>
          <p className="text-sm text-muted-foreground px-4">
            {maybes.length} people are on the fence. Send a targeted perk and watch who bites.
          </p>
        </SheetHeader>

        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {maybes.map((m) => (
            <div
              key={m.user_id}
              className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-secondary/60 border border-border/60"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={m.avatar_url ?? undefined} />
                <AvatarFallback
                  className="text-[10px]"
                  {...avatarFallbackProps(m.display_name ?? m.user_id)}
                >
                  {m.display_name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{m.display_name ?? "Someone"}</span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
            The offer
          </p>
          <div className="grid grid-cols-2 gap-2">
            {OFFERS.map((o) => {
              const active = offer === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => {
                    haptic("selection");
                    setOffer(o.key);
                  }}
                  className={`text-left p-3 rounded-2xl border text-sm transition-all ${
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          If ~45% convert:{" "}
          <span className="font-bold text-emerald-400">
            +{projectedRevenue.value.toFixed(2).replace(".", ",")} €
          </span>{" "}
          at the door
        </p>

        <Button
          className="w-full mt-3 gap-2 h-12 text-base font-semibold"
          onClick={handleSend}
          disabled={sending || !maybes.length}
        >
          <Zap className="h-4 w-4" />
          Send perk to {maybes.length} {maybes.length === 1 ? "maybe" : "maybes"}
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default ConvertMaybesSheet;
