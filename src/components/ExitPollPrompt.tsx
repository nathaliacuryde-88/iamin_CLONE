import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePendingExitPolls } from "@/hooks/useExitPoll";
import ExitPollSheet from "@/components/ExitPollSheet";

const SESSION_KEY = "exit-poll-prompted";
const DISMISS_KEY = "exit-poll-dismissed-v1";

const readDismissed = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const writeDismissed = (s: Set<string>) => {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
};

/**
 * Auto-opens the exit poll sheet once per session if there are
 * past events the user RSVP'd "going" to and hasn't rated yet.
 * Events the user explicitly skipped or closed are remembered
 * (localStorage) so we don't nag about the same one repeatedly.
 */
const ExitPollPrompt = () => {
  const location = useLocation();
  const { data: pending = [] } = usePendingExitPolls();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());

  const eligible = useMemo(
    () => pending.filter((e) => !dismissed.has(e.id)),
    [pending, dismissed]
  );

  useEffect(() => {
    if (!eligible.length) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (["/auth", "/reset-password"].includes(location.pathname)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [eligible.length, location.pathname]);

  if (!eligible.length) return null;
  return (
    <ExitPollSheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          // Closing without rating = treat all remaining as dismissed
          const next = new Set(dismissed);
          eligible.forEach((e) => next.add(e.id));
          setDismissed(next);
          writeDismissed(next);
        }
        setOpen(v);
      }}
      events={eligible}
      onDismissOne={(id) => {
        const next = new Set(dismissed);
        next.add(id);
        setDismissed(next);
        writeDismissed(next);
      }}
    />
  );
};

export default ExitPollPrompt;
