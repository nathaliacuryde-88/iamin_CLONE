import { useMemo, useState } from "react";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/dateFormat";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEventTab,
  computeBalances,
  simplifyDebts,
  formatCents,
} from "@/hooks/useEventTab";
import AddExpenseSheet, { type AttendeeOption } from "./AddExpenseSheet";
import SettleUpSheet from "./SettleUpSheet";

interface EventTabSectionProps {
  eventId: string;
  eventName: string;
  attendees: AttendeeOption[];
  isOwner: boolean;
}

const EventTabSection = ({ eventId, eventName, attendees, isOwner }: EventTabSectionProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  const { data: expenses = [], isLoading } = useEventTab(eventId);

  const totalCents = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [expenses]
  );
  const currency = expenses[0]?.currency ?? "EUR";

  const balances = useMemo(() => computeBalances(expenses), [expenses]);
  const settlements = useMemo(() => simplifyDebts(new Map(balances)), [balances]);

  const myNet = user ? balances.get(user.id) ?? 0 : 0;

  const profileFor = (uid: string) => attendees.find((a) => a.user_id === uid);
  const nameFor = (uid: string) => {
    if (uid === user?.id) return t("common.you");
    const p = profileFor(uid);
    return p?.display_name ?? t("profile.user");
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from("event_expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["event-tab", eventId] });
      toast({ title: "Expense removed" });
    }
  };

  // Empty state
  if (!isLoading && expenses.length === 0) {
    return (
      <>
        <Card className="tactile-widget">
          <CardContent className="p-5 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{t("tab.start_title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("tab.start_desc")}
              </p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="glow-sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("tab.add_first")}
            </Button>
          </CardContent>
        </Card>

        <AddExpenseSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          eventId={eventId}
          eventName={eventName}
          attendees={attendees}
          currency={currency}
        />
      </>
    );
  }

  return (
    <>
      <Card className="tactile-widget">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" />
              {t("tab.title")}
            </CardTitle>
            <span className="text-sm font-semibold text-foreground">
              {formatCents(totalCents, currency)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Recent expenses */}
          <div className="space-y-2">
            {expenses.slice(0, 5).map((e) => {
              const canDelete =
                user && (user.id === e.created_by || user.id === e.payer_id || isOwner);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={profileFor(e.payer_id)?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]" {...avatarFallbackProps(profileFor(e.payer_id)?.display_name ?? e.payer_id)}>
                      {profileFor(e.payer_id)?.display_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{nameFor(e.payer_id)}</span>
                      <span className="text-muted-foreground"> {t("tab.paid")} </span>
                      <span className="font-medium">{formatCents(e.amount_cents, e.currency)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.description} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDeleteExpense(e.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
            {expenses.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                {t("tab.more", { count: expenses.length - 5 })}
              </p>
            )}
          </div>

          {/* Your balance */}
          {user && (
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                {t("tab.your_balance")}
              </p>
              {myNet > 0 ? (
                <p className="text-sm">
                  {t("tab.you_owed")}{" "}
                  <span className="font-semibold text-accent">
                    {formatCents(myNet, currency)}
                  </span>
                </p>
              ) : myNet < 0 ? (
                <p className="text-sm">
                  {t("tab.you_owe")}{" "}
                  <span className="font-semibold text-destructive">
                    {formatCents(-myNet, currency)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("tab.all_settled")}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setSettleOpen(true)}
              disabled={settlements.length === 0}
            >
              {t("tab.settle_up")}
            </Button>
            <Button size="sm" className="flex-1 glow-sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("tab.add_expense")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddExpenseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        eventId={eventId}
        eventName={eventName}
        attendees={attendees}
        currency={currency}
      />
      <SettleUpSheet
        open={settleOpen}
        onOpenChange={setSettleOpen}
        settlements={settlements}
        expenses={expenses}
        attendees={attendees}
        eventId={eventId}
        eventName={eventName}
        currency={currency}
      />
    </>
  );
};

export default EventTabSection;
