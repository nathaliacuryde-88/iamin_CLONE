import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronRight } from "lucide-react";
import { type BirthdayCard, useMarkCardOpened } from "@/hooks/useBirthdayCards";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  cards: BirthdayCard[];
  onClose: () => void;
}

const textBoxClass = (style: string) => {
  switch (style) {
    case "solid": return "bg-black/85 text-white px-3 py-2 rounded-lg";
    case "translucent": return "bg-white/25 backdrop-blur-md text-white px-3 py-2 rounded-lg ring-1 ring-white/30";
    case "outline": return "text-white px-3 py-2 rounded-lg ring-2 ring-white/80";
    default: return "";
  }
};

/** Tiny confetti burst — emoji-only, no extra deps. */
const ConfettiBurst = () => {
  const pieces = Array.from({ length: 24 });
  const emojis = ["🎉", "✨", "🎊", "💖", "🥳", "⭐", "🎈"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.6 + Math.random() * 1.4;
        const emoji = emojis[i % emojis.length];
        const drift = (Math.random() - 0.5) * 80;
        return (
          <motion.span
            key={i}
            initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
            animate={{ y: "110vh", x: drift, opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration, delay, ease: "easeIn" }}
            className="absolute text-2xl"
            style={{ left: `${left}%`, top: 0 }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
};

const gradientFor = (color: string) => {
  const map: Record<string, string> = {
    "from-primary to-accent": "linear-gradient(135deg, hsl(263 70% 60%), hsl(330 80% 65%))",
    "from-pink-500 to-orange-400": "linear-gradient(135deg, hsl(330 80% 60%), hsl(25 90% 60%))",
    "from-blue-500 to-cyan-400": "linear-gradient(135deg, hsl(220 80% 60%), hsl(190 80% 60%))",
    "from-emerald-400 to-lime-300": "linear-gradient(135deg, hsl(160 70% 55%), hsl(80 80% 70%))",
    "from-yellow-400 to-rose-400": "linear-gradient(135deg, hsl(45 90% 60%), hsl(0 80% 70%))",
    "from-violet-600 to-fuchsia-500": "linear-gradient(135deg, hsl(265 80% 55%), hsl(295 85% 60%))",
  };
  return map[color] ?? map["from-primary to-accent"];
};

const BirthdayCardReveal = ({ cards, onClose }: Props) => {
  const [revealCards] = useState(cards);
  const [index, setIndex] = useState(0);
  const markOpened = useMarkCardOpened();
  const cardRef = useRef<HTMLDivElement>(null);
  const current = revealCards[index];
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBgUrl(null);
    const path = current?.background_image_url;
    if (!path) return;
    if (/^https?:\/\//i.test(path)) { setBgUrl(path); return; }
    supabase.storage.from("birthday-cards").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled && data?.signedUrl) setBgUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [current?.background_image_url]);

  if (!current) return null;

  const isLast = index >= revealCards.length - 1;
  const closeAndSave = () => {
    onClose();
    revealCards.forEach((card) => void markOpened(card.id));
  };
  const next = () => {
    if (isLast) closeAndSave();
    else setIndex((i) => i + 1);
  };

  const downloadCard = () => {
    // Render the card to an offscreen canvas as a downloadable PNG.
    const W = 800;
    const H = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    // Pull two colors from the gradient string.
    const css = gradientFor(current.color);
    const matches = css.match(/hsl\([^)]+\)/g) ?? ["#7c3aed", "#ec4899"];
    grad.addColorStop(0, matches[0]);
    grad.addColorStop(1, matches[1] ?? matches[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(`From ${current.sender?.display_name ?? "a friend"}`, W / 2, 200);
    ctx.font = "300px system-ui, 'Apple Color Emoji', sans-serif";
    ctx.fillText(current.emoji, W / 2, 540);
    ctx.fillStyle = "#fff";
    ctx.font = "700 56px system-ui, sans-serif";
    ctx.fillText("Happy birthday! 🎂", W / 2, 660);
    if (current.message) {
      ctx.font = "italic 28px system-ui, sans-serif";
      const words = current.message.split(" ");
      let line = "";
      let y = 740;
      for (const w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > W - 120 && line) {
          ctx.fillText(`"${line.trim()}"`, W / 2, y);
          line = w + " ";
          y += 40;
        } else line = test;
      }
      if (line) ctx.fillText(`"${line.trim()}"`, W / 2, y);
    }
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `birthday-card-${current.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
    void markOpened(current.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl p-6">
      <ConfettiBurst />
      <button
        onClick={closeAndSave}
        className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-4 z-20 h-10 w-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          ref={cardRef}
          initial={{ scale: 0.6, rotateY: -90, opacity: 0 }}
          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="relative w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl overflow-hidden"
          style={bgUrl ? { background: `url(${bgUrl}) center/cover` } : { background: gradientFor(current.color) }}
        >
          {bgUrl && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
          <div className="relative z-10">
            <p className={cn("text-xs uppercase tracking-[0.2em] mb-3", current.text_box_enabled ? `inline-block ${textBoxClass(current.text_box_style)}` : "text-white/80")}>
              From {current.sender?.display_name ?? "a friend"}
            </p>
            <motion.div
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-7xl mb-4 drop-shadow-2xl"
            >
              {current.emoji}
            </motion.div>
            <h2 className={cn("font-bold text-2xl mb-3", current.text_box_enabled ? `inline-block ${textBoxClass(current.text_box_style)}` : "text-white drop-shadow")}>
              Happy birthday! 🎂
            </h2>
            {current.message ? (
              <p className={cn("text-base italic leading-relaxed mt-2", current.text_box_enabled ? `inline-block ${textBoxClass(current.text_box_style)}` : "text-white/95 drop-shadow")}>
                "{current.message}"
              </p>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action icons OUTSIDE the card, centered at the bottom */}
      <div className="mt-8 flex items-center gap-6 z-10">
        <button
          onClick={downloadCard}
          aria-label="Save card"
          title="Save card"
          className="h-12 w-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white hover:bg-white/25 transition shadow-lg"
        >
          <Download className="h-5 w-5" />
        </button>
        {!isLast && (
          <button
            onClick={next}
            aria-label="Next card"
            title={`Next (${index + 1}/${revealCards.length})`}
            className="h-12 w-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white hover:bg-white/25 transition shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
      {revealCards.length > 1 && (
        <p className="text-white/70 text-xs mt-3 z-10">
          {index + 1} / {revealCards.length}
        </p>
      )}
    </div>
  );
};

export default BirthdayCardReveal;
