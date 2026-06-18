import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type AttendeeOption = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  attendees: AttendeeOption[];
  currency?: string;
}

const AddExpenseSheet = ({
  open,
  onOpenChange,
  eventId,
  eventName,
  attendees,
  currency = "EUR",
}: AddExpenseSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payerId, setPayerId] = useState<string>(user?.id ?? "");
  const [splitWith, setSplitWith] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Reset & default when opening
  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setPayerId(user?.id ?? "");
      setSplitWith(new Set(attendees.map((a) => a.user_id)));
    }
  }, [open, attendees, user?.id]);

  const toggleSplit = (id: string) => {
    setSplitWith((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    const amt = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Add a short description", variant: "destructive" });
      return;
    }
    if (splitWith.size === 0) {
      toast({ title: "Pick at least one person to split with", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: expense, error } = await supabase
        .from("event_expenses")
        .insert({
          event_id: eventId,
          payer_id: payerId,
          amount_cents: amt,
          currency,
          description: description.trim(),
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Equal split
      const ids = Array.from(splitWith);
      const base = Math.floor(amt / ids.length);
      const remainder = amt - base * ids.length;
      const shares = ids.map((uid, i) => ({
        expense_id: expense.id,
        user_id: uid,
        share_cents: base + (i < remainder ? 1 : 0),
      }));
      const { error: shareErr } = await supabase.from("expense_shares").insert(shares);
      if (shareErr) throw shareErr;

      // Notify everyone in the split (except current user)
      const recipients = ids.filter((uid) => uid !== user.id);
      if (recipients.length > 0) {
        await supabase.from("notifications").insert(
          recipients.map((rid) => ({
            recipient_id: rid,
            sender_id: user.id,
            type: "expense_added",
            event_id: eventId,
            content: `added "${description.trim()}" to the Tab on ${eventName}`,
          }))
        );
      }

      qc.invalidateQueries({ queryKey: ["event-tab", eventId] });
      toast({ title: "Added to Tab" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to add expense", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tab</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs text-muted-foreground">
              Amount ({currency})
            </Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-semibold h-14"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs text-muted-foreground">
              What for?
            </Label>
            <Input
              id="desc"
              placeholder="e.g. Uber to venue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Paid by */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Paid by</Label>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => {
                const selected = a.user_id === payerId;
                return (
                  <button
                    key={a.user_id}
                    onClick={() => setPayerId(a.user_id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all border ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={a.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {a.display_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{a.user_id === user?.id ? "Me" : a.display_name ?? "User"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split between */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Split between ({splitWith.size})
              </Label>
              <button
                className="text-[11px] text-primary hover:underline"
                onClick={() =>
                  setSplitWith(
                    splitWith.size === attendees.length
                      ? new Set()
                      : new Set(attendees.map((a) => a.user_id))
                  )
                }
              >
                {splitWith.size === attendees.length ? "Clear" : "Everyone"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => {
                const selected = splitWith.has(a.user_id);
                return (
                  <button
                    key={a.user_id}
                    onClick={() => toggleSplit(a.user_id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all border ${
                      selected
                        ? "bg-accent/20 text-accent-foreground border-accent/40"
                        : "bg-secondary text-muted-foreground border-border hover:border-accent/30"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={a.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {a.display_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{a.user_id === user?.id ? "Me" : a.display_name ?? "User"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full glow-sm">
            {submitting ? "Adding..." : "Add tab"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddExpenseSheet;
