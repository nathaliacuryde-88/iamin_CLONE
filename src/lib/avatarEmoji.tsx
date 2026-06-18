// Deterministic emoji avatar fallback. Pairs an emoji with a gradient
// background so every "no photo" avatar still feels personal.

const EMOJI = [
  "🍑","🍒","🍓","🍇","🍉","🥑","🌶️","🍍","🥥","🍋",
  "🌸","🌻","🌺","🍄","🌵","🌙","⭐","✨","🔥","💫",
  "🎲","🎯","🎮","🎧","🪩","🎸","🥁","🎷","🎺","🪐",
  "🦋","🐳","🦊","🐼","🦄","🐙","🐝","🦖","🦦","🦔",
  "🛼","🛹","⚽","🏀","🎱","🛸","🚀","🗿","🧊","🎈",
  "🦩","🦚","🪼","🦭","🐬","🦜","🦥","🐢","🐧","🦒",
];

// Soft pastel pairs — first is bg start, second bg end. Picked so dark
// emoji glyphs (e.g. 🍒, 🦔) still pop with comfortable contrast.
const GRADIENTS = [
  ["#FDBA74","#FB7185"], // peach -> rose
  ["#5EEAD4","#22D3EE"], // mint  -> cyan
  ["#FCA5A5","#F472B6"], // coral -> pink
  ["#A5B4FC","#C4B5FD"], // indigo-> violet
  ["#FCD34D","#FB923C"], // amber -> orange
  ["#86EFAC","#34D399"], // lime  -> emerald
  ["#93C5FD","#A78BFA"], // blue  -> purple
  ["#F9A8D4","#C084FC"], // pink  -> purple
  ["#FDE68A","#A7F3D0"], // butter-> mint
  ["#67E8F9","#A78BFA"], // cyan  -> purple
];

const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
};

export const getAvatarEmoji = (seed?: string | null) => {
  const key = (seed && seed.length > 0 ? seed : "?").toLowerCase();
  const h = hash(key);
  const emoji = EMOJI[h % EMOJI.length];
  const [a, b] = GRADIENTS[(h >>> 8) % GRADIENTS.length];
  return { emoji, gradient: `linear-gradient(135deg, ${a}, ${b})` };
};

/** Spread on <AvatarFallback /> to get an emoji on a soft gradient. */
export const emojiFallbackProps = (seed?: string | null) => {
  const { emoji, gradient } = getAvatarEmoji(seed);
  return {
    style: { background: gradient, color: "#0f172a" },
    children: <span className="text-[1.1em] leading-none drop-shadow-sm">{emoji}</span>,
  };
};
