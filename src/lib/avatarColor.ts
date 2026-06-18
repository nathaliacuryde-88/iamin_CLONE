// Deterministic solid-color background for avatar fallbacks (when no image).
// Uses a fixed saturation/lightness so it matches the nightlife dark theme.

const PALETTE = [
  "#7C3AED", // primary purple
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#EF4444", // red
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#F43F5E", // rose
  "#22C55E", // green
  "#EAB308", // yellow
  "#A855F7", // purple
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const getAvatarColor = (seed?: string | null) => {
  const key = (seed && seed.length > 0 ? seed : "?").toLowerCase();
  return PALETTE[hash(key) % PALETTE.length];
};

/** Spread on <AvatarFallback /> to get a colored solid bg + white initial. */
export const avatarFallbackProps = (seed?: string | null) => ({
  style: { backgroundColor: getAvatarColor(seed), color: "#fff" },
});
