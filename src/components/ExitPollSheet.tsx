import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitRating, type EventRating } from "@/hooks/useExitPoll";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";


interface PendingEvent {
  id: string;
  name: string;
  date: string | null;
}

interface ExitPollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: PendingEvent[];
  /** Called when the user explicitly dismisses one event (Skip or "I wasn't in"). */
  onDismissOne?: (eventId: string) => void;
}

const OPTIONS: { rating: EventRating; emoji: string; label: string }[] = [
  { rating: "fire", emoji: "🔥", label: "Worth it" },
  { rating: "mid", emoji: "😐", label: "Mid" },
  { rating: "flop", emoji: "💀", label: "Flop" },
];

const ExitPollSheet = ({ open, onOpenChange, events, onDismissOne }: ExitPollSheetProps) => {
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const submit = useSubmitRating();
  const haptic = useHaptics();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();


  const current = events[index];

  const advance = () => {
    if (index < events.length - 1) setIndex(index + 1);
    else {
      onOpenChange(false);
      setIndex(0);
    }
  };

  const handleVote = async (rating: EventRating) => {
    if (!current) return;
    haptic(rating === "fire" ? "success" : rating === "flop" ? "warning" : "light");
    try {
      await submit.mutateAsync({ eventId: current.id, rating });
      // Post anonymous comment if user wrote anything
      const trimmed = note.trim();
      if (trimmed && user) {
        await supabase
          .from("event_exit_poll_comments" as any)
          .insert({ event_id: current.id, author_id: user.id, content: trimmed.slice(0, 500) });
      }
      setNote("");
      if (index < events.length - 1) {
        setIndex(index + 1);
      } else {
        onOpenChange(false);
        setIndex(0);
        toast({ title: "Thanks for the vibe check ✨" });
      }
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e.message, variant: "destructive" });
    }
  };


  const handleNotIn = async () => {
    if (!current || !user) return;
    haptic("light");
    try {
      await supabase
        .from("attendees")
        .delete()
        .eq("event_id", current.id)
        .eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["pending-exit-polls"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      onDismissOne?.(current.id);
      toast({ title: "Got it — removed from your list" });
      advance();
    } catch (e: any) {
      toast({ title: "Couldn't update", description: e.message, variant: "destructive" });
    }
  };

  const handleSkip = () => {
    if (current) onDismissOne?.(current.id);
    advance();
  };


  if (!current) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t-0">
        <SheetHeader className="text-center mb-6">
          <SheetTitle className="text-xl">How was it?</SheetTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {current.name}
          </p>
          {events.length > 1 && (
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {index + 1} of {events.length}
            </p>
          )}
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 px-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.rating}
              disabled={submit.isPending}
              onClick={() => handleVote(opt.rating)}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl glass transition-all disabled:opacity-50 hover:scale-105 active:scale-95 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-5xl transition-transform duration-200 group-active:scale-110">
                {opt.emoji}
              </span>
              <span className="text-xs text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 px-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Anything to add? Votes and comments are anonymous and should help host improvement."
            className="min-h-[64px] text-sm bg-secondary/40 border-border/60 resize-none"
            maxLength={500}
          />
        </div>


        <div className="flex flex-col items-center gap-2 mt-6 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNotIn}
            className="rounded-full"
          >
            I wasn't in
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExitPollSheet;
