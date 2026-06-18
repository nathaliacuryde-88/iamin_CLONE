import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addDays, format, parseISO, differenceInCalendarDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function datesInRange(start: Date, end: Date): string[] {
  const [a, b] = start <= end ? [start, end] : [end, start];
  const days = differenceInCalendarDays(b, a);
  const out: string[] = [];
  for (let i = 0; i <= days; i++) {
    out.push(format(addDays(a, i), "yyyy-MM-dd"));
  }
  return out;
}

export function useAvailabilityBlocks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["availability-blocks", user?.id],
    queryFn: async () => {
      if (!user) return [] as { date: string; reason: string | null }[];
      const { data } = await supabase
        .from("availability_blocks" as any)
        .select("date, reason")
        .eq("user_id", user.id);
      return ((data ?? []) as any[]).map((r) => ({ date: r.date as string, reason: (r.reason ?? null) as string | null }));
    },
    enabled: !!user,
  });

  const blocks = (query.data ?? []).map((b) => b.date);
  const blockedSet = new Set(blocks);
  const reasonByDate = new Map((query.data ?? []).map((b) => [b.date, b.reason] as const));

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["availability-blocks", user?.id] });

  const addRange = async (start: Date, end: Date, reason?: string) => {
    if (!user) return;
    const dates = datesInRange(start, end).filter((d) => !blockedSet.has(d));
    if (dates.length === 0) {
      invalidate();
      return;
    }
    const { error } = await supabase
      .from("availability_blocks" as any)
      .insert(dates.map((date) => ({ user_id: user.id, date, reason: reason ?? null })));
    if (error) {
      toast({ title: "Couldn't mark unavailable", description: error.message, variant: "destructive" });
    } else {
      toast({ title: dates.length === 1 ? "Marked unavailable" : `${dates.length} days marked unavailable` });
    }
    invalidate();
  };

  const removeRange = async (dateStrs: string[]) => {
    if (!user || dateStrs.length === 0) return;
    const { error } = await supabase
      .from("availability_blocks" as any)
      .delete()
      .eq("user_id", user.id)
      .in("date", dateStrs);
    if (error) {
      toast({ title: "Couldn't erase", description: error.message, variant: "destructive" });
    } else {
      toast({ title: dateStrs.length === 1 ? "Day freed up" : `${dateStrs.length} days freed up` });
    }
    invalidate();
  };

  const updateReason = async (dateStrs: string[], reason: string) => {
    if (!user || dateStrs.length === 0) return;
    const { error } = await supabase
      .from("availability_blocks" as any)
      .update({ reason: reason || null })
      .eq("user_id", user.id)
      .in("date", dateStrs);
    if (error) {
      toast({ title: "Couldn't save reason", description: error.message, variant: "destructive" });
    }
    invalidate();
  };


  const replaceRange = async (oldDateStrs: string[], newStart: Date, newEnd: Date, reason?: string) => {
    if (!user) return;
    const newDates = datesInRange(newStart, newEnd);
    const { error: delErr } = await supabase
      .from("availability_blocks" as any)
      .delete()
      .eq("user_id", user.id)
      .in("date", oldDateStrs);
    if (delErr) {
      toast({ title: "Couldn't update", description: delErr.message, variant: "destructive" });
      invalidate();
      return;
    }
    const { error: insErr } = await supabase
      .from("availability_blocks" as any)
      .insert(newDates.map((date) => ({ user_id: user.id, date, reason: reason ?? null })));
    if (insErr) {
      toast({ title: "Couldn't update", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: "Range updated" });
    }
    invalidate();
  };

  // Walk neighbors to find contiguous range that includes `dateStr`.
  const findContiguousRange = (dateStr: string): string[] => {
    if (!blockedSet.has(dateStr)) return [];
    const out = [dateStr];
    let cursor = parseISO(dateStr);
    while (true) {
      const prev = format(addDays(cursor, -1), "yyyy-MM-dd");
      if (blockedSet.has(prev)) {
        out.unshift(prev);
        cursor = addDays(cursor, -1);
      } else break;
    }
    cursor = parseISO(dateStr);
    while (true) {
      const next = format(addDays(cursor, 1), "yyyy-MM-dd");
      if (blockedSet.has(next)) {
        out.push(next);
        cursor = addDays(cursor, 1);
      } else break;
    }
    return out;
  };

  return { blocks, blockedSet, reasonByDate, addRange, removeRange, replaceRange, updateReason, findContiguousRange };
}
