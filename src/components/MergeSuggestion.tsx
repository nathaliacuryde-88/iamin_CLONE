import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { rankDuplicates } from "@/lib/eventMatch";
import { useMergeEvents } from "@/hooks/useMergeEvents";
import { useFriendIds } from "@/hooks/useFriendIds";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GitMerge, X } from "lucide-react";

interface Props {
  /** The event currently being viewed — the potential DUPLICATE to fold in. */
  event: { id: string; name: string; date?: string | null; city?: string | null; source_url?: string | null };
  /** Only the owner of this event may merge it into another. */
  isOwner: boolean;
}

/**
 * When the owner is viewing their own event and a similar event they can see
 * already exists, offer to merge theirs into it so RSVPs stop splitting.
 */
const MergeSuggestion = ({ event, isOwner }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: friendIds = [] } = useFriendIds();
  const { merge, merging } = useMergeEvents();
  const [match, setMatch] = useState<{ id: string; name: string; creator: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOwner || dismissed) return;
    let cancelled = false;
    (async () => {
      // Prefer the server RPC (fuzzy + visibility-scoped).
      try {
        const { data, error } = await (supabase as any).rpc("find_similar_events", {
          _name: event.name,
          _date: event.date ?? null,
          _city: event.city ?? null,
          _source_url: event.source_url ?? null,
        });
        if (!error && Array.isArray(data)) {
          const best = data.find((d: any) => d.id !== event.id);
          if (!cancelled && best) {
            setMatch({ id: best.id, name: best.name, creator: best.creator_name ?? "A friend" });
            return;
          }
          if (!cancelled) return; // RPC ran, nothing found
        }
      } catch { /* fall through */ }

      // Fallback: rank friends' events client-side.
      if (friendIds.length === 0) return;
      const { data: rows } = await supabase
        .from("events")
        .select("id, name, date, city, source_url, created_by")
        .in("created_by", friendIds)
        .limit(50);
      const ranked = rankDuplicates(
        { name: event.name, date: event.date, city: event.city, sourceUrl: event.source_url },
        (rows ?? []) as any,
      ).filter((r) => r.id !== event.id);
      if (!cancelled && ranked[0]) {
        const best = ranked[0];
        const { data: prof } = await supabase
          .from("profiles").select("display_name").eq("user_id", best.created_by!).maybeSingle();
        setMatch({ id: best.id, name: best.name, creator: prof?.display_name ?? "A friend" });
      }
    })();
    return () => { cancelled = true; };
  }, [isOwner, dismissed, event.id, event.name, event.date, event.city, event.source_url, friendIds]);

  if (!isOwner || dismissed || !match) return null;

  const onMerge = async () => {
    // Fold THIS event (the duplicate) into the friend's existing one.
    const res = await merge(match.id, event.id);
    if (res.ok) {
      toast({ title: "Merged 🎉", description: `Everyone's now on ${match.creator}'s event.` });
      navigate(`/event/${match.id}`);
    } else {
      toast({ title: "Couldn't merge", description: res.error, variant: "destructive" });
    }
  };

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
      <GitMerge className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Looks like {match.creator}'s "{match.name}"
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Merge yours into theirs so everyone RSVPs to one event.
        </p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={onMerge} disabled={merging}>
            {merging ? "Merging…" : "Merge into theirs"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/event/${match.id}`)} disabled={merging}>
            View theirs
          </Button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="text-muted-foreground shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MergeSuggestion;
