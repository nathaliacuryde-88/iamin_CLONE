import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

/**
 * Merge one event into another via the merge_events RPC.
 * `duplicateId` (which the caller owns) is folded into `primaryId`.
 */
export function useMergeEvents() {
  const qc = useQueryClient();
  const [merging, setMerging] = useState(false);

  const merge = useCallback(
    async (primaryId: string, duplicateId: string): Promise<{ ok: boolean; error?: string }> => {
      setMerging(true);
      try {
        const { error } = await (supabase as any).rpc("merge_events", {
          _primary_id: primaryId,
          _duplicate_id: duplicateId,
        });
        if (error) throw error;
        // Feed/calendar/event queries need to refetch to reflect the collapse.
        await qc.invalidateQueries();
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message ?? "Merge failed" };
      } finally {
        setMerging(false);
      }
    },
    [qc],
  );

  return { merge, merging };
}
