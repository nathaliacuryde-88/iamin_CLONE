import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCents, type Expense, type Settlement } from "@/hooks/useEventTab";
import type { AttendeeOption } from "./AddExpenseSheet";
import { buildPayLink, PROVIDERS, type PayProvider } from "@/lib/payLinks";
import { copyToClipboard } from "@/lib/clipboard";

interface SettleUpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlements: Settlement[];
  expenses: Expense[];
  attendees: AttendeeOption[];
  eventId: string;
  eventName: string;
  currency?: string;
}

const SettleUpSheet = ({
  open,
  onOpenChange,
  settlements,
  expenses,
  attendees,
  eventId,
  eventName,
  currency = "EUR",
}: SettleUpSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const profileFor = (uid: string) => attendees.find((a) => a.user_id === uid);
  const nameFor = (uid: string) => {
    const p = profileFor(uid);
    return uid === user?.id ? "You" : p?.display_name ?? "User";
  };

  // Pull payment handles for everyone involved so we can render deep-link buttons.
  const recipientIds = Array.from(new Set(settlements.map((s) => s.to)));
  const { data: handlesMap } = useQuery({
    queryKey: ["pay-handles", recipientIds.join(",")],
    enabled: open && recipientIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_payment_handles")
        .select("user_id, paypal_handle, n26_handle, revolut_handle")
        .in("user_id", recipientIds);
      const map = new Map<string, { paypal?: string; n26?: string; revolut?: string }>();
      for (const r of (data ?? []) as any[]) {
        map.set(r.user_id, {
          paypal: r.paypal_handle ?? undefined,
          n26: r.n26_handle ?? undefined,
          revolut: r.revolut_handle ?? undefined,
        });
      }
      return map;
    },
  });

  // Mark all unsettled shares between two users as settled (simplified MVP)
  const handleMarkPaid = async (from: string, to: string, cents: number) => {
    // Find unsettled shares where payer = `to` and share user = `from`
    const targetExpenses = expenses.filter((e) => e.payer_id === to);
    const shareIds: string[] = [];
    let remaining = cents;
    for (const e of targetExpenses) {
      for (const s of e.shares) {
        if (s.user_id === from && !s.settled_at && remaining > 0) {
          shareIds.push(s.id);
          remaining -= s.share_cents;
        }
      }
    }

    if (shareIds.length === 0) {
      toast({ title: "Nothing to settle", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("expense_shares")
      .update({ settled_at: new Date().toISOString() })
      .in("id", shareIds);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Notify the recipient
    if (user && to !== user.id) {
      await supabase.from("notifications").insert({
        recipient_id: to,
        sender_id: user.id,
        type: "debt_settled",
        event_id: eventId,
        content: `paid you ${formatCents(cents, currency)} on ${eventName}`,
      });
    }

    qc.invalidateQueries({ queryKey: ["event-tab", eventId] });
    toast({ title: "Marked as paid" });
  };

  const handleCopy = async (from: string, to: string, cents: number) => {
    const fromName = nameFor(from);
    const toName = nameFor(to);
    const msg = `Hey ${toName === "You" ? fromName : toName}, can you send ${formatCents(
      cents,
      currency
    )} for "${eventName}"? — via the Tab`;
    const ok = await copyToClipboard(msg);
    toast({ title: ok ? "Message copied" : "Couldn't copy", description: ok ? undefined : "Long-press to copy manually." });
  };

  const handlePay = async (provider: PayProvider, handle: string, cents: number) => {
    const url = buildPayLink(provider, {
      handle,
      amountCents: cents,
      currency,
      note: eventName,
    });
    if (!url) return;
    if (provider === "n26") {
      // N26 has no amount-bearing deep link — copy amount + note and open the profile.
      const ok = await copyToClipboard(`${formatCents(cents, currency)} — ${eventName}`);
      toast({
        title: ok ? "Amount copied" : "Opening N26",
        description: ok ? "Paste it in N26 after MoneyBeam opens." : undefined,
      });
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleRemind = async (from: string, to: string, cents: number) => {
    if (!user) return;
    const debtorId = from;
    if (debtorId === user.id) return;
    await supabase.from("notifications").insert({
      recipient_id: debtorId,
      sender_id: user.id,
      type: "expense_reminder",
      event_id: eventId,
      content: `reminded you about ${formatCents(cents, currency)} on ${eventName}`,
    });
    toast({ title: "Reminder sent" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settle up</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {settlements.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              All settled up — nothing to pay 🎉
            </p>
          ) : (
            settlements.map((s, i) => {
              const involvesMe = s.from === user?.id || s.to === user?.id;
              const youOwe = s.from === user?.id;
              const youAreOwed = s.to === user?.id;
              const fromP = profileFor(s.from);
              const toP = profileFor(s.to);
              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 border ${
                    involvesMe ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={fromP?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]" {...avatarFallbackProps(fromP?.display_name ?? s.from)}>
                          {fromP?.display_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{nameFor(s.from)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={toP?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]" {...avatarFallbackProps(toP?.display_name ?? s.to)}>
                          {toP?.display_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{nameFor(s.to)}</span>
                    </div>
                    <span className={`text-sm font-semibold ${youOwe ? "text-destructive" : youAreOwed ? "text-accent" : ""}`}>
                      {formatCents(s.cents, currency)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Payment deep links — visible only to the person who owes */}
                    {youOwe && (() => {
                      const h = handlesMap?.get(s.to);
                      const providers: PayProvider[] = ["paypal", "revolut", "n26"];
                      const available = providers.filter((p) => h?.[p]);
                      if (available.length === 0) return null;
                      return available.map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          className="h-8 text-xs bg-primary/90 hover:bg-primary text-primary-foreground"
                          onClick={() => handlePay(p, h![p]!, s.cents)}
                        >
                          <span className="mr-1">{PROVIDERS[p].emoji}</span> {PROVIDERS[p].label}
                          <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                        </Button>
                      ));
                    })()}
                    {(youOwe || youAreOwed) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleMarkPaid(s.from, s.to, s.cents)}
                      >
                        <Check className="h-3 w-3 mr-1" /> Mark paid
                      </Button>
                    )}
                    {youOwe && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleCopy(s.from, s.to, s.cents)}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy message
                      </Button>
                    )}
                    {youAreOwed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleRemind(s.from, s.to, s.cents)}
                      >
                        Remind
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettleUpSheet;
