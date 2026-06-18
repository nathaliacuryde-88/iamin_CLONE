import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

const TAGLINES = [
  "Your weekend looks suspicious… 👀",
  "Drop one. Even a bad one.",
  "The group chat won't plan itself.",
  "Bored? Manifest a Tuesday.",
  "Something. Anything. A picnic counts.",
];

/**
 * End-of-feed CTA rendered as the **last card** inside the wallet stack.
 * Same outer shape/border-radius as EventCard so it feels like part of the deck.
 */
const AddMoreEventsCTA = () => {
  const haptic = useHaptics();
  const [tagIdx, setTagIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTagIdx((i) => (i + 1) % TAGLINES.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary/25 via-accent/15 to-primary/10 border border-primary/30 glow-sm flex flex-col items-center justify-center text-center px-6">
      {/* Ambient blur glow to match EventCard depth */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-60 h-60 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 text-6xl mb-4 drop-shadow-[0_10px_30px_hsl(var(--primary)/0.5)]"
      >
        ✨
      </motion.div>

      <p className="relative z-10 text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">
        Plot twist
      </p>

      <motion.p
        key={tagIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="relative z-10 mt-3 text-xl font-bold tracking-tight max-w-[280px]"
      >
        {TAGLINES[tagIdx]}
      </motion.p>

      <p className="relative z-10 mt-3 text-sm text-muted-foreground max-w-[280px]">
        Add an event and watch the circle wake up.
      </p>

      <Link
        to="/add-event?mode=person"
        onClick={() => haptic("medium")}
        className="relative z-10 mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold glow-sm hover:opacity-95 transition-opacity"
      >
        <Plus className="h-4 w-4" /> Add an event
      </Link>
    </div>
  );
};

export default AddMoreEventsCTA;
