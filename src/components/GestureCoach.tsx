import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "iamin.coach.feed.v1";

/**
 * One-time gesture coach overlay shown the first time a user opens the feed.
 * Full-bleed purple gradient background that ends just above the CTA button.
 */
const loop = { duration: 6, repeat: Infinity, ease: "easeInOut" as const };

const card = {
  x: [0, 0, 70, 0, 0, -70, 0, 0, 0, 0],
  rotate: [0, 0, 8, 0, 0, -8, 0, 0, 0, 0],
  scale: [1, 1, 1, 1, 1, 1, 1, 0.96, 1, 1],
  transition: { ...loop, times: [0, 0.05, 0.14, 0.24, 0.38, 0.42, 0.52, 0.74, 0.84, 1] },
};

const hand = {
  x: [0, 0, 70, 0, 0, -70, 0, 0, 0],
  y: [0, 0, -30, 0, 0, -30, 0, -90, 0],
  transition: { ...loop, times: [0, 0.05, 0.14, 0.24, 0.38, 0.42, 0.52, 0.74, 1] },
};

const stampIn = {
  opacity: [0, 0, 1, 0, 0],
  transition: { ...loop, times: [0, 0.06, 0.14, 0.24, 1] },
};
const stampMb = {
  opacity: [0, 0, 1, 0, 0],
  transition: { ...loop, times: [0, 0.32, 0.42, 0.52, 1] },
};
const reactBar = {
  scale: [0, 0, 1, 0],
  transition: { ...loop, times: [0, 0.66, 0.76, 0.9] },
};

const CAPS = [
  "Swipe right to say you're in",
  "Swipe left for a maybe",
  "Long-press to react",
];

interface Props {
  onDone: () => void;
}

const GestureCoach = ({ onDone }: Props) => {
  const [cap, setCap] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCap((c) => (c + 1) % 3), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6"
    >
      {/* Purple glass card */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-white/15 shadow-2xl backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(165deg, hsl(258 90% 66% / 0.85) 0%, hsl(280 85% 62% / 0.8) 45%, hsl(310 80% 60% / 0.75) 100%)",
        }}
      >
        <div className="flex flex-col items-center pt-10 pb-8 px-6">
          <div
            className="relative flex items-center justify-center"
            style={{ width: 240, height: 290 }}
          >
            {/* Demo card */}
            <motion.div
              animate={card}
              className="relative rounded-2xl overflow-visible shadow-2xl flex items-center justify-center"
              style={{
                width: 190,
                aspectRatio: "4 / 5",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-7xl drop-shadow-lg" aria-hidden>
                🪩
              </span>

              <motion.div
                animate={stampIn}
                className="absolute top-6 right-4 -rotate-12 px-3 py-1 rounded-md border-2 border-emerald-300 text-emerald-100 text-xs font-black tracking-widest"
                style={{ opacity: 0, textShadow: "0 0 12px rgba(110,231,183,0.7)" }}
              >
                I'M IN
              </motion.div>

              <motion.div
                animate={stampMb}
                className="absolute top-6 left-4 rotate-12 px-3 py-1 rounded-md border-2 border-amber-200 text-amber-100 text-xs font-black tracking-widest"
                style={{ opacity: 0, textShadow: "0 0 12px rgba(253,230,138,0.7)" }}
              >
                MAYBE
              </motion.div>

              <motion.div
                animate={reactBar}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/95 border border-border shadow-xl whitespace-nowrap"
                style={{ scale: 0, transformOrigin: "center center" }}
              >
                <span className="text-base leading-none" aria-hidden>🔥</span>
                <span className="text-base leading-none" aria-hidden>👀</span>
                <span className="text-base leading-none" aria-hidden>💀</span>
              </motion.div>


            </motion.div>

            <motion.div
              animate={hand}
              className="absolute pointer-events-none"
              style={{ bottom: 8, left: "50%", marginLeft: -14 }}
              aria-hidden
            >
              <div className="h-7 w-7 rounded-full bg-white/95 shadow-[0_0_24px_rgba(255,255,255,0.6)] flex items-center justify-center text-base">
                👆
              </div>
            </motion.div>
          </div>

          <p
            key={cap}
            className="mt-4 text-base font-semibold text-white text-center animate-fade-in"
          >
            {CAPS[cap]}
          </p>

          <Button
            onClick={onDone}
            className="mt-5 px-8 rounded-full glow-sm bg-white text-primary hover:bg-white/90 font-semibold"
          >
            Start
          </Button>
        </div>
      </div>
    </motion.div>
  );
};


export default GestureCoach;

export const shouldShowFeedCoach = () => {
  if (typeof window === "undefined") return false;
  return !window.localStorage.getItem(STORAGE_KEY);
};

export const markFeedCoachSeen = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "1");
};
