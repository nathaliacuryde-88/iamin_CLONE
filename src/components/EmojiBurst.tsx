import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

interface Props {
  emoji: string | null;
  /** Card rect (viewport coords). Burst rises from the bottom up. */
  rect: DOMRect | null;
  onDone: () => void;
}

/**
 * Confetti-like burst of a single emoji floating up from the bottom of the
 * card to the top. Auto-dismisses after the animation finishes.
 */
const EmojiBurst = ({ emoji, rect, onDone }: Props) => {
  // Stable particles per burst.
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * 80,
        delay: Math.random() * 0.18,
        rot: (Math.random() - 0.5) * 60,
        scale: 0.85 + Math.random() * 0.6,
      })),
    [emoji, rect],
  );

  useEffect(() => {
    if (!emoji) return;
    const t = window.setTimeout(onDone, 1100);
    return () => window.clearTimeout(t);
  }, [emoji, onDone]);

  if (!emoji || !rect || typeof document === "undefined") return null;

  const startX = rect.left + rect.width / 2;
  const startY = rect.bottom - 24;
  const travel = rect.height - 32;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9000]">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: startX, y: startY, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              x: startX + p.dx,
              y: startY - travel,
              opacity: [0, 1, 1, 0],
              scale: p.scale,
              rotate: p.rot,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.95,
              delay: p.delay,
              ease: [0.22, 1, 0.36, 1],
              opacity: { times: [0, 0.15, 0.7, 1], duration: 0.95, delay: p.delay },
            }}
            className="absolute top-0 left-0 text-3xl will-change-transform"
            style={{ translateX: "-50%", translateY: "-50%" }}
          >
            {emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
};

export default EmojiBurst;
