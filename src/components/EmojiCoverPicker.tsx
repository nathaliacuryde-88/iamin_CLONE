import { useMemo, useState } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

export const COVER_COLORS = [
  { name: "Purple", value: "262 83% 58%" },
  { name: "Pink", value: "330 80% 60%" },
  { name: "Blue", value: "220 90% 60%" },
  { name: "Teal", value: "175 70% 45%" },
  { name: "Lime", value: "85 70% 50%" },
  { name: "Amber", value: "38 95% 55%" },
  { name: "Coral", value: "10 85% 60%" },
  { name: "Slate", value: "220 15% 35%" },
];

export type EmojiCover = {
  emoji: string; // can hold 1-5 emojis concatenated
  color: string; // HSL triplet "H S% L%"
};

// ─── HSL <-> hex helpers ────────────────────────────────────────────
const hslTripletToHex = (triplet: string): string => {
  const m = triplet.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return "#7c3aed";
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHslTriplet = (hex: string): string => {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Split a possibly multi-emoji string into individual emoji segments.
const splitEmojis = (s: string): string[] => {
  if (!s) return [];
  try {
    // Intl.Segmenter handles surrogate pairs / ZWJ sequences cleanly.
    // @ts-ignore
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      // @ts-ignore
      const seg = new (Intl as any).Segmenter("en", { granularity: "grapheme" });
      return Array.from(seg.segment(s), (x: any) => x.segment).filter(Boolean);
    }
  } catch { /* ignore */ }
  return Array.from(s);
};

const MAX_EMOJIS = 5;

const EmojiCoverPicker = ({
  value,
  onChange,
  hidePreview = false,
}: {
  value: EmojiCover | null;
  onChange: (v: EmojiCover) => void;
  hidePreview?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const current = value ?? { emoji: "✨", color: COVER_COLORS[0].value };
  const emojis = useMemo(() => splitEmojis(current.emoji), [current.emoji]);
  const hex = hslTripletToHex(current.color);

  const setEmojis = (next: string[]) => {
    // Allow empty — cover can be background-only.
    onChange({ ...current, emoji: next.join("") });
  };

  const addEmoji = (e: string) => {
    if (emojis.length >= MAX_EMOJIS) return;
    setEmojis([...emojis, e]);
  };

  const removeEmoji = (idx: number) => {
    setEmojis(emojis.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {!hidePreview && (
        <div
          className="rounded-xl h-[180px] flex items-center justify-center gap-2 shadow-inner overflow-hidden px-4"
          style={{ background: `hsl(${current.color})` }}
        >
          {emojis.length === 0 ? null : emojis.length === 1 ? (
            <span className="text-7xl drop-shadow-md">{emojis[0]}</span>
          ) : (
            emojis.map((e, i) => (
              <span
                key={i}
                className="drop-shadow-md"
                style={{
                  fontSize: emojis.length <= 2 ? 64 : emojis.length === 3 ? 52 : 44,
                  transform: `rotate(${(i - (emojis.length - 1) / 2) * 8}deg)`,
                }}
              >
                {e}
              </span>
            ))
          )}
        </div>
      )}

      {/* Picked emoji chips with remove */}
      {emojis.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {emojis.map((e, i) => (
            <button
              key={i}
              type="button"
              onClick={() => removeEmoji(i)}
              className="group inline-flex items-center gap-1 px-2 h-7 rounded-full bg-secondary text-sm border border-border hover:border-destructive/40"
              aria-label={`Remove ${e}`}
            >
              <span>{e}</span>
              <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5" disabled={emojis.length >= MAX_EMOJIS}>
              <Plus className="h-3.5 w-3.5" /> Add emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 border-0 bg-transparent w-auto" align="start">
            <EmojiPicker
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.NATIVE}
              onEmojiClick={(e) => {
                addEmoji(e.emoji);
                if (emojis.length + 1 >= MAX_EMOJIS) setOpen(false);
              }}
              width={320}
              height={380}
            />
          </PopoverContent>
        </Popover>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Pick up to {MAX_EMOJIS} emojis — use Cover Studio below for colors, stickers and text.
      </p>
    </div>
  );
};

export default EmojiCoverPicker;
