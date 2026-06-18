import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LineStatus, STATUS_META, formatRelative, useLineMode, useLineModeMutations } from "@/hooks/useLineMode";
import LineModeActivateSheet from "./LineModeActivateSheet";
import { useToast } from "@/hooks/use-toast";

const COMPACT: LineStatus[] = ["walk_in", "short_wait", "long_wait", "closed"];

interface Props {
  eventId: string;
  eventDate: string | null;
  /** Treat as event day even outside the date (e.g. for testing). */
  forceEnabled?: boolean;
}

const isEventDay = (date: string | null) => {
  if (!date) return false;
  return date === new Date().toISOString().slice(0, 10);
};

const LineModeWidget = ({ eventId, eventDate, forceEnabled }: Props) => {
  const { toast } = useToast();
  const { isActive, session, history, current } = useLineMode(eventId);
  const { activate, setStatus, endSession } = useLineModeMutations(eventId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmClosed, setConfirmClosed] = useState(false);
  const [reminderMin, setReminderMin] = useState<number | null>(null);

  useEffect(() => {
    setNoteDraft(current?.note ?? "");
  }, [current?.note]);

  // Local reminder: fires a toast after the chosen interval, or 30 min idle default.
  useEffect(() => {
    if (!isActive) return;
    const ms = (reminderMin ?? 30) * 60 * 1000;
    const t = window.setTimeout(() => {
      toast({
        title: "Still accurate?",
        description: reminderMin
          ? `It's been ${reminderMin} min — update line status?`
          : "Line status hasn't changed in 30 min — still accurate?",
      });
    }, ms);
    return () => window.clearTimeout(t);
  }, [reminderMin, current?.id, isActive, toast]);

  const dayOK = forceEnabled || isEventDay(eventDate);

  if (!dayOK) {
    return (
      <Card className="glass opacity-70">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Line Mode</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Available on event day.</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-secondary" />
          </div>
          <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Activates on event day
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <>
        <Card className="glass">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <h3 className="text-base font-semibold">Line Mode — tap to go live</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Let attendees know what the door situation is.
            </p>
            <Button className="w-full glow-sm" onClick={() => setSheetOpen(true)}>
              Activate →
            </Button>
          </CardContent>
        </Card>
        <LineModeActivateSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          loading={activate.isPending}
          onConfirm={(status, note) => {
            activate.mutate({ status, note }, {
              onSuccess: () => { setSheetOpen(false); toast({ title: "Line Mode is live" }); },
              onError: (e: any) => toast({ title: "Couldn't go live", description: e.message, variant: "destructive" }),
            });
          }}
        />
      </>
    );
  }

  const meta = current ? STATUS_META[current.status] : STATUS_META.walk_in;

  const handleSetStatus = (s: LineStatus) => {
    if (!session) return;
    if (s === "closed") { setConfirmClosed(true); return; }
    setStatus.mutate({ sessionId: session.id, status: s, note: noteDraft || null });
  };

  const handleUpdateNote = () => {
    if (!session || !current) return;
    setStatus.mutate({ sessionId: session.id, status: current.status, note: noteDraft.trim() || null });
  };

  return (
    <>
      <Card className="glass">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Line Mode</h3>
              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${meta.pill}`}>
                <span className={`h-2 w-2 rounded-full ${meta.dot} ${current?.status !== "closed" ? "animate-pulse" : ""}`} />
                <span className="text-sm font-bold">{meta.emoji} {meta.label}</span>
              </div>
              {current && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Updated {formatRelative(current.created_at)}
                </p>
              )}
            </div>
          </div>

          {current?.note && (
            <p className="text-xs text-foreground/80 italic px-3 py-2 rounded-lg bg-secondary/40">"{current.note}"</p>
          )}

          <div className="grid grid-cols-4 gap-1.5">
            {COMPACT.map((s) => {
              const m = STATUS_META[s];
              const active = current?.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={setStatus.isPending}
                  className={`rounded-lg border p-2 transition-all ${m.tint} ${active ? m.border + " ring-1" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <div className="text-base leading-none">{m.emoji}</div>
                  <div className="text-[9px] font-semibold mt-1 truncate">{m.label}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Update or clear the note"
              maxLength={140}
            />
            {(noteDraft || "") !== (current?.note ?? "") && (
              <Button size="sm" variant="outline" className="w-full" onClick={handleUpdateNote}>
                Update note
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Remind me to update in:</p>
            <div className="flex gap-1.5">
              {[15, 30, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setReminderMin(m)}
                  className={`px-3 py-1 rounded-full text-[11px] border ${reminderMin === m ? "bg-primary/20 text-primary border-primary/40" : "border-border/60 text-muted-foreground"}`}
                >
                  {m === 60 ? "1 hour" : `${m} min`}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tonight</p>
              <LineModeTimeline history={history} />
            </div>
          )}

          <button
            onClick={() => setConfirmEnd(true)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline mx-auto block"
          >
            Close line mode
          </button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End line mode for tonight?</AlertDialogTitle>
            <AlertDialogDescription>The history will be saved to your Pulse.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => session && endSession.mutate(session.id)}>End night</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClosed} onOpenChange={setConfirmClosed}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Closed for the night?</AlertDialogTitle>
            <AlertDialogDescription>
              You can fully end Line Mode or keep it active in case the queue moves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (session) setStatus.mutate({ sessionId: session.id, status: "closed", note: noteDraft || null });
            }}>Keep active</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (session) {
                setStatus.mutate({ sessionId: session.id, status: "closed", note: noteDraft || null }, {
                  onSettled: () => endSession.mutate(session.id),
                });
              }
            }}>End night</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const LineModeTimeline = ({ history }: { history: { id: string; status: LineStatus; created_at: string }[] }) => {
  if (!history.length) return null;
  return (
    <div className="space-y-1.5">
      {history.map((h, i) => {
        const m = STATUS_META[h.status];
        const last = i === history.length - 1;
        return (
          <div key={h.id} className="flex items-center gap-2 text-[11px]">
            <span className={`h-2 w-2 rounded-full ${m.dot} ${last ? "animate-pulse" : ""}`} />
            <span className="font-medium">{m.emoji} {m.label}</span>
            <span className="text-muted-foreground ml-auto">
              {new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {last && " · now"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default LineModeWidget;
