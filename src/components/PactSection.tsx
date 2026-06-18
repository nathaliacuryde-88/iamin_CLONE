import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Handshake, X, Check, Sparkles, Search } from "lucide-react";
import {
  usePactsForEvent,
  useProposePact,
  useRespondPact,
  useMutualFriends,
} from "@/hooks/usePact";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import { useFriendStatuses } from "@/hooks/useFriendStatuses";
import { STATUS_EMOJI } from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";
import { emojiFallbackProps } from "@/lib/avatarEmoji";

interface PactSectionProps {
  eventId: string;
  eventName: string;
}

/**
 * Pact — "I'll go if you go". Mutual-friends-only.
 * - Pending pacts the user proposed: show with Cancel.
 * - Pending pacts where the user is the partner: show Accept / Decline.
 * - Sealed pacts: celebratory state, both auto-RSVP'd via DB trigger.
 */
const PactSection = ({ eventId, eventName }: PactSectionProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const haptic = useHaptics();
  const { toast } = useToast();
  const { data: pacts = [] } = usePactsForEvent(eventId);
  const { data: friends = [] } = useMutualFriends();
  const propose = useProposePact();
  const respond = useRespondPact();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const activePacts = pacts.filter((p) => p.status === "pending" || p.status === "sealed");
  const partneredIds = new Set(
    activePacts.flatMap((p) => [p.proposer_id, p.partner_id]).filter((id) => id !== user?.id)
  );
  const availableFriends = friends.filter((f) => !partneredIds.has(f.user_id));

  const friendIds = availableFriends.map((f) => f.user_id);
  const { data: statusMap = {} } = useFriendStatuses(friendIds);

  const filteredFriends = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return availableFriends;
    return availableFriends.filter((f) =>
      (f.display_name ?? "").toLowerCase().includes(q) ||
      (f.username ?? "").toLowerCase().includes(q)
    );
  }, [availableFriends, pickerQuery]);

  const handlePropose = async (partnerId: string) => {
    haptic("medium");
    const partnerStatus = statusMap[partnerId];
    const partner = availableFriends.find((f) => f.user_id === partnerId);
    if (partnerStatus?.status === "not_tonight") {
      const ok = window.confirm(
        `${partner?.display_name ?? "They"} are taking it easy tonight 🌙 — still want to send the pact?`
      );
      if (!ok) return;
    }
    try {
      await propose.mutateAsync({ eventId, partnerId });
      toast({ title: "Pact sent!", description: "They'll seal it on their end." });
      setPickerOpen(false);
    } catch (e: any) {
      toast({ title: "Couldn't send pact", description: e.message, variant: "destructive" });
    }
  };

  const handleRespond = async (
    pactId: string,
    status: "sealed" | "declined" | "cancelled"
  ) => {
    haptic(status === "sealed" ? "success" : "light");
    try {
      await respond.mutateAsync({ pactId, eventId, status });
      if (status === "sealed") toast({ title: "Pact sealed! You're both in 🤝" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <Card className="tactile-widget">
      <CardHeader className="pb-3">
        <CardTitle className="tactile-title flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" />
          {t("pact.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("pact.tagline")}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activePacts.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("pact.none_yet")}</p>
        )}

        {activePacts.map((p) => {
          const otherId = p.proposer_id === user.id ? p.partner_id : p.proposer_id;
          const other = friends.find((f) => f.user_id === otherId);
          const sealed = p.status === "sealed";
          const incoming = p.partner_id === user.id && p.status === "pending";
          const outgoing = p.proposer_id === user.id && p.status === "pending";

          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg ${
                sealed ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/40"
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={other?.avatar_url ?? undefined} />
                <AvatarFallback {...emojiFallbackProps(other?.display_name ?? otherId)} />
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {other?.display_name ?? t("pact.friend_fallback")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {sealed ? (
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {t("pact.sealed")}
                    </span>
                  ) : incoming ? (
                    t("pact.wants_pact")
                  ) : (
                    t("pact.waiting")
                  )}
                </p>
              </div>
              {incoming && (
                <div className="flex gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRespond(p.id, "declined")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-7 w-7 glow-sm"
                    onClick={() => handleRespond(p.id, "sealed")}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {outgoing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => handleRespond(p.id, "cancelled")}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="w-full glass"
          onClick={() => setPickerOpen(true)}
          disabled={availableFriends.length === 0}
        >
          <Handshake className="h-3.5 w-3.5 mr-1.5" />
          {availableFriends.length === 0 ? t("pact.no_friends") : t("pact.make")}
        </Button>
      </CardContent>

      <Sheet
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) {
            setPickerQuery("");
            setSelectedPartner(null);
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          <SheetHeader className="text-center">
            <SheetTitle className="text-xl">Make a pact</SheetTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              “I'll go if you go.” Pick a friend — when they accept, you're{" "}
              <span className="text-foreground font-semibold">both auto-RSVP'd</span>. No backing out.
            </p>
          </SheetHeader>

          {availableFriends.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl card-surface dark:bg-white/[0.04] dark:border-white/10 px-3 h-11">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search friends"
                className="flex-1 bg-transparent border-0 px-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}

          <div className="mt-2 max-h-[48vh] overflow-y-auto -mx-2 px-2 pt-4">
            {availableFriends.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {t("pact.mutual_only")}
              </p>
            )}
            {availableFriends.length > 0 && filteredFriends.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No friends match “{pickerQuery}”
              </p>
            )}
            <div className="grid grid-cols-4 gap-x-3 gap-y-5">
              {filteredFriends.map((f) => {
                const active = selectedPartner === f.user_id;
                const status = statusMap[f.user_id];
                const dot =
                  status?.status === "available"
                    ? "bg-emerald-400"
                    : status?.status === "not_tonight"
                      ? "bg-amber-400"
                      : status
                        ? "bg-cyan-400"
                        : null;
                return (
                  <button
                    key={f.user_id}
                    type="button"
                    onClick={() => {
                      haptic("selection");
                      setSelectedPartner(active ? null : f.user_id);
                    }}
                    className="flex flex-col items-center gap-1.5 group focus-visible:outline-none"
                  >
                    <div className={`relative rounded-full transition-all ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : ""}`}>
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={f.avatar_url ?? undefined} />
                        <AvatarFallback {...emojiFallbackProps(f.display_name ?? f.user_id)} />
                      </Avatar>
                      {dot && (
                        <span className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full ring-2 ring-background ${dot}`} />
                      )}
                    </div>
                    <p className="text-[12px] font-medium text-foreground/90 truncate max-w-full leading-tight">
                      {f.display_name ?? t("pact.friend_fallback")}
                    </p>
                    {status?.status === "not_tonight" && (
                      <span title={STATUS_EMOJI[status.status]} className="text-[10px] leading-none">{STATUS_EMOJI[status.status]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            className="w-full h-12 mt-4 rounded-2xl glow-sm text-base font-semibold"
            disabled={!selectedPartner}
            onClick={() => selectedPartner && handlePropose(selectedPartner)}
          >
            <Handshake className="h-4 w-4 mr-2" /> Propose the pact
          </Button>
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default PactSection;
