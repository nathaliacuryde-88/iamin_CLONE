import { motion } from "framer-motion";
import { Check, Compass, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";

const CaughtUpScreen = ({ onShare }: { onShare?: () => void }) => {
  const haptic = useHaptics();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-3xl card-surface relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      {/* Animated check */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
        className="relative z-10 h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)]"
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </motion.div>

      <h3 className="relative z-10 mt-5 text-lg font-bold tracking-tight">You're all caught up</h3>
      <p className="relative z-10 mt-1.5 text-sm text-muted-foreground max-w-[260px]">
        That's every event from your circle. Want to find more or invite someone new?
      </p>

      <div className="relative z-10 mt-5 flex flex-col gap-2 w-full max-w-xs">
        <Link
          to="/discover"
          onClick={() => haptic("light")}
          className="flex items-center justify-center gap-2 h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold glow-sm hover:opacity-95 transition-opacity"
        >
          <Compass className="h-4 w-4" /> Discover events
        </Link>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onShare?.();
          }}
          className="flex items-center justify-center gap-2 h-11 rounded-full bg-secondary text-foreground text-sm font-semibold border border-border hover:bg-secondary/80 transition-colors"
        >
          <Share2 className="h-4 w-4" /> Invite a friend
        </button>
      </div>
    </motion.div>
  );
};

export default CaughtUpScreen;
