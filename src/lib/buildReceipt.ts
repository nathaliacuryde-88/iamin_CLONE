import { supabase } from "@/integrations/supabase/client";

export interface NightReceipt {
  eventName: string;
  date: string | null;
  city: string | null;
  myShareCents: number;
  tableTotalCents: number;
  currency: string;
  prediction: string | null;
  verdict: "fire" | "mid" | "flop" | null;
  verdictCounts: { fire: number; mid: number; flop: number };
  attendeesCount: number;
  photosCount: number;
}

export async function buildReceipt(
  eventId: string,
  currentUserId: string,
): Promise<NightReceipt | null> {
  const { data: event } = await supabase
    .from("events")
    .select("id, name, date, city")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return null;

  const [
    { data: expenses },
    { data: shares },
    { data: messages },
    pulseRes,
    { count: attendeesCount },
    { count: photosCount },
  ] = await Promise.all([
    supabase.from("event_expenses").select("id, amount_cents, currency").eq("event_id", eventId),
    supabase
      .from("expense_shares")
      .select("share_cents, expense:event_expenses!inner(event_id)")
      .eq("user_id", currentUserId)
      .eq("expense.event_id", eventId),
    supabase
      .from("time_capsule_messages")
      .select("content, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(1),
    supabase.rpc("get_event_pulse_stats" as any, { _event_id: eventId }),
    supabase
      .from("attendees")
      .select("user_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going"),
    supabase
      .from("time_capsule_photos")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
  ]);

  const tableTotalCents = (expenses ?? []).reduce((s, e: any) => s + (e.amount_cents ?? 0), 0);
  const currency = ((expenses ?? [])[0] as any)?.currency ?? "EUR";
  const myShareCents = (shares ?? []).reduce((s: number, r: any) => s + (r.share_cents ?? 0), 0);
  const prediction = (messages ?? [])[0]?.content ?? null;

  const pulseRow = (pulseRes.data as any[])?.[0];
  const verdictCounts = {
    fire: pulseRow?.fire_count ?? 0,
    mid: pulseRow?.mid_count ?? 0,
    flop: pulseRow?.flop_count ?? 0,
  };
  let verdict: "fire" | "mid" | "flop" | null = null;
  const maxV = Math.max(verdictCounts.fire, verdictCounts.mid, verdictCounts.flop);
  if (maxV > 0) {
    verdict =
      verdictCounts.fire === maxV ? "fire" : verdictCounts.mid === maxV ? "mid" : "flop";
  }

  return {
    eventName: event.name,
    date: event.date,
    city: (event as any).city ?? null,
    myShareCents,
    tableTotalCents,
    currency,
    prediction,
    verdict,
    verdictCounts,
    attendeesCount: attendeesCount ?? 0,
    photosCount: photosCount ?? 0,
  };
}

export const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency || "EUR").toUpperCase(),
  }).format(cents / 100);
