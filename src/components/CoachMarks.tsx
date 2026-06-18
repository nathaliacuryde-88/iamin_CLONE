import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronRight, Hand, Camera, Users } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "iamin.coachmarks.v1";

const SLIDES = [
  {
    icon: Hand,
    title: "Swipe to RSVP",
    body: "Right is I'm in. Left is Maybe. The deck remembers your taste.",
    accent: "from-primary/30 to-accent/20",
  },
  {
    icon: Camera,
    title: "Add events in seconds",
    body: "Snap a screenshot or paste a link — we'll parse the date, place and vibe for you.",
    accent: "from-primary/40 to-primary/10",
  },
  {
    icon: Users,
    title: "See who's in",
    body: "Friends going show up first. Long-press a card to drop a reaction.",
    accent: "from-accent/30 to-primary/20",
  },
];

/**
 * First-launch tour. Shown at most once per user across all devices.
 * Tracked in BOTH localStorage AND profiles.coach_seen — whichever fires
 * first wins, and we passively persist after slide 1 has been visible ≥2s.
 */
const CoachMarks = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const haptic = useHaptics();
  const persistedRef = useRef(false);

  // Decide whether to show. Considers localStorage AND server flag.
  useEffect(() => {
    let cancelled = false;
    const decide = async () => {
      try {
        const seenLocal = window.localStorage.getItem(STORAGE_KEY) === "1";
        if (seenLocal) return;
        if (!user) {
          // Anonymous — fall back to localStorage only
          if (!cancelled) setOpen(true);
          return;
        }
        const { data } = await supabase
          .from("user_preferences" as any)
          .select("coach_seen")
          .eq("user_id", user.id)
          .maybeSingle();
        const seenServer = !!(data as any)?.coach_seen;
        if (seenServer) {
          // Mirror to localStorage so future loads short-circuit
          try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
          return;
        }
        if (!cancelled) setOpen(true);
      } catch {
        if (!cancelled) setOpen(true);
      }
    };
    decide();
    return () => { cancelled = true; };
  }, [user]);

  const persistSeen = async () => {
    if (persistedRef.current) return;
    persistedRef.current = true;
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    if (user) {
      try {
        await supabase
          .from("user_preferences" as any)
          .upsert({ user_id: user.id, coach_seen: true } as any, { onConflict: "user_id" });
      } catch { /* silent */ }
    }
  };

  // Passive dismiss: after 2 s on slide 1, mark as seen.
  // (User can still finish the tour, but we won't show it again.)
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => { persistSeen(); }, 2000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dismiss = () => {
    persistSeen();
    haptic("light");
    setOpen(false);
  };

  const next = () => {
    if (idx < SLIDES.length - 1) {
      haptic("selection");
      setIdx(idx + 1);
    } else {
      dismiss();
    }
  };

  const handleSwipe = (_: any, info: PanInfo) => {
    if (info.offset.x < -60 && idx < SLIDES.length - 1) {
      next();
    } else if (info.offset.x > 60 && idx > 0) {
      haptic("selection");
      setIdx(idx - 1);
    }
  };

  if (!open) return null;
  const slide = SLIDES[idx];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-xl flex items-center justify-center px-6"
      >
        <motion.div
          key={idx}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={handleSwipe}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative w-full max-w-sm rounded-3xl card-surface p-8 text-center overflow-hidden"
        >
          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-br ${slide.accent} blur-3xl pointer-events-none`} />

          <div className="relative z-10 flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-5">
              <Icon className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{slide.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-[280px] leading-relaxed">
              {slide.body}
            </p>

            {/* Pagination dots */}
            <div className="flex items-center gap-1.5 mt-6">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? "w-6 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={next}
                className="h-11 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5 glow-sm"
              >
                {idx < SLIDES.length - 1 ? (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                ) : (
                  "Let's go"
                )}
              </button>
              {idx < SLIDES.length - 1 && (
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip intro
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoachMarks;
