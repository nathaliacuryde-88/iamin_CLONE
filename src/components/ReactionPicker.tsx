import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useHaptics } from "@/hooks/useHaptics";

export const REACTION_EMOJIS = ["🔥", "👀", "💀", "🥂", "❤️", "🎉"] as const;

interface Props {
  open: boolean;
  onPick: (emoji: string) => void;
  onClose: () => void;
  /**
   * Anchor in viewport coords. The picker's LEFT edge is placed at `x` and
   * vertically centered on `y`. This keeps the row hugging the card's left
   * edge so it can never be cropped on narrow screens.
   */
  anchor?: { x: number; y: number } | null;
}

const PICKER_W = 300;
const PICKER_H = 60;
const MARGIN = 12;

const ReactionPicker = ({ open, onPick, onClose, anchor }: Props) => {
  const haptic = useHaptics();
  const [vp, setVp] = useState({ w: 1024, h: 768 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Left-align so the picker hugs the left edge of the held card. Clamp so
  // it never overflows the viewport.
  const pos = (() => {
    const ax = anchor?.x ?? MARGIN;
    const ay = anchor?.y ?? vp.h / 2;
    const left = Math.min(Math.max(ax, MARGIN), Math.max(MARGIN, vp.w - PICKER_W - MARGIN));
    const top = Math.min(Math.max(ay - PICKER_H / 2, MARGIN), vp.h - PICKER_H - MARGIN);
    return { left, top };
  })();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-background/40 backdrop-blur-sm select-none"
            style={{
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              touchAction: "manipulation",
            }}
          />
          {/* Picker — left-aligned, vertically centered on anchor */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 620, damping: 26, mass: 0.55 }}
            className="fixed z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-full bg-card/95 backdrop-blur-2xl border border-border shadow-[0_18px_48px_-12px_hsl(var(--primary)/0.55)] select-none"
            style={{
              left: pos.left,
              top: pos.top,
              width: PICKER_W,
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              touchAction: "manipulation",
            }}
          >
            {REACTION_EMOJIS.map((emo, i) => (
              <motion.button
                key={emo}
                type="button"
                initial={{ scale: 0.2, opacity: 0, y: 14 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{
                  delay: 0.025 * i,
                  type: "spring",
                  stiffness: 720,
                  damping: 18,
                  mass: 0.5,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  haptic("medium");
                  onPick(emo);
                }}
                className="h-10 w-10 rounded-full flex items-center justify-center text-2xl hover:scale-125 active:scale-110 transition-transform select-none"
                style={{
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                  touchAction: "manipulation",
                }}
                aria-label={`React with ${emo}`}
              >
                {emo}
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    , document.body
  );
};

export default ReactionPicker;
