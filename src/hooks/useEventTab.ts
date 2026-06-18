import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ExpenseShare = {
  id: string;
  expense_id: string;
  user_id: string;
  share_cents: number;
  settled_at: string | null;
};

export type Expense = {
  id: string;
  event_id: string;
  payer_id: string;
  amount_cents: number;
  currency: string;
  description: string;
  created_by: string;
  created_at: string;
  shares: ExpenseShare[];
};

export type Balance = {
  user_id: string;
  net_cents: number; // positive = others owe you; negative = you owe
};

export type Settlement = { from: string; to: string; cents: number };

export const useEventTab = (eventId: string | undefined) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["event-tab", eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<Expense[]> => {
      const { data: expenses, error } = await supabase
        .from("event_expenses")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!expenses || expenses.length === 0) return [];

      const ids = expenses.map((e) => e.id);
      const { data: shares } = await supabase
        .from("expense_shares")
        .select("*")
        .in("expense_id", ids);

      return expenses.map((e) => ({
        ...e,
        shares: (shares ?? []).filter((s) => s.expense_id === e.id),
      }));
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event-tab-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_expenses", filter: `event_id=eq.${eventId}` },
        () => qc.invalidateQueries({ queryKey: ["event-tab", eventId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_shares" },
        () => qc.invalidateQueries({ queryKey: ["event-tab", eventId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, qc]);

  return query;
};

// Compute net balance per user across an array of expenses
export const computeBalances = (expenses: Expense[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const e of expenses) {
    // Payer is owed amount_cents (minus their own share if they have one)
    map.set(e.payer_id, (map.get(e.payer_id) ?? 0) + e.amount_cents);
    for (const s of e.shares) {
      if (s.settled_at) continue;
      map.set(s.user_id, (map.get(s.user_id) ?? 0) - s.share_cents);
    }
    // For shares marked settled, we still need to subtract the payer's "credit" because the share was never paid back via settlement infra (MVP: simple toggle)
    // Adjust: for settled shares, also remove payer credit so net stays balanced
    for (const s of e.shares) {
      if (s.settled_at) {
        map.set(e.payer_id, (map.get(e.payer_id) ?? 0) - s.share_cents);
      }
    }
  }
  return map;
};

// Greedy debt simplification
export const simplifyDebts = (balances: Map<string, number>): Settlement[] => {
  const creditors: { user: string; cents: number }[] = [];
  const debtors: { user: string; cents: number }[] = [];
  for (const [user, cents] of balances) {
    if (cents > 0) creditors.push({ user, cents });
    else if (cents < 0) debtors.push({ user, cents: -cents });
  }
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const result: Settlement[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(d.cents, c.cents);
    if (amt > 0) result.push({ from: d.user, to: c.user, cents: amt });
    d.cents -= amt;
    c.cents -= amt;
    if (d.cents === 0) i++;
    if (c.cents === 0) j++;
  }
  return result;
};

export const formatCents = (cents: number, currency = "EUR") => {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
};
