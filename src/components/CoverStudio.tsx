import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check, Plus, Sparkles, Palette, Smile, Type } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

type LayerBase = { id: string; x: number; y: number; scale: number; rotate: number };
type EmojiLayer = LayerBase & { kind: "emoji"; emoji: string };
type TextWeight = "bold" | "medium" | "light";
type TextLayer = LayerBase & { kind: "text"; text: string; color: string; weight: TextWeight };
type Layer = EmojiLayer | TextLayer;

const PRESET_BGS = [
  "262 83% 58%", "330 80% 60%", "220 90% 60%", "175 70% 45%",
  "85 70% 50%", "38 95% 55%", "10 85% 60%", "220 15% 35%",
];

const STICKERS = ["✨", "🔥", "💜", "⭐", "🌙", "🪩", "🎉", "🍸", "🌴", "⚡", "💋"];

type Preset = {
  id: string;
  label: string;
  emoji: string;
  bg: string;
  bg2?: string;
};

const PRESETS: Preset[] = [
  { id: "glow", label: "Glow", emoji: "✨", bg: "270 80% 60%", bg2: "330 80% 65%" },
  { id: "party", label: "Party", emoji: "🎉", bg: "20 90% 60%", bg2: "340 85% 65%" },
  { id: "chill", label: "Chill", emoji: "🌊", bg: "200 80% 60%", bg2: "175 70% 55%" },
  { id: "disco", label: "Disco", emoji: "🪩", bg: "220 15% 25%", bg2: "260 30% 35%" },
  { id: "birthday", label: "Birthday", emoji: "🎂", bg: "20 90% 65%", bg2: "340 85% 70%" },
  { id: "sunny", label: "Sunny", emoji: "☀️", bg: "85 65% 55%", bg2: "175 60% 55%" },
];

const hexToHsl = (hex: string): string => {
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

const uid = () => Math.random().toString(36).slice(2, 9);

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => void;
  initialEmoji?: string | null;
  initialColor?: string | null;
}

type StudioTab = "presets" | "color" | "stickers" | "text";

const TAB_META: { id: StudioTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "presets", label: "Presets", icon: Sparkles },
  { id: "color", label: "Color", icon: Palette },
  { id: "stickers", label: "Stickers", icon: Smile },
  { id: "text", label: "Text", icon: Type },
];

const weightClass = (w: TextWeight) =>
  w === "bold" ? "font-extrabold" : w === "medium" ? "font-semibold" : "font-light";

const CoverStudio = ({ open, onClose, onSave, initialEmoji, initialColor }: Props) => {
  const haptic = useHaptics();
  const stageRef = useRef<HTMLDivElement>(null);
  const [bg, setBg] = useState(initialColor || PRESET_BGS[0]);
  const [useGradient, setUseGradient] = useState(true);
  const [gradient2, setGradient2] = useState(PRESET_BGS[1]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<StudioTab>("presets");
  const [customEmoji, setCustomEmoji] = useState("");
  const [textInput, setTextInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialColor) setBg(initialColor);
    if (initialEmoji) {
      setLayers([{ kind: "emoji", id: uid(), emoji: initialEmoji, x: 0, y: 0, scale: 1, rotate: 0 }]);
    } else {
      setLayers([]);
    }
    setSelectedId(null);
    setTab("presets");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const selectedText = selected?.kind === "text" ? selected : null;

  const addEmoji = (e: string) => {
    haptic("light");
    const id = uid();
    setLayers((ls) => [...ls, { kind: "emoji", id, emoji: e, x: 0, y: 0, scale: 1, rotate: 0 }]);
    setSelectedId(id);
  };

  const addText = () => {
    if (!textInput.trim()) return;
    haptic("light");
    const id = uid();
    setLayers((ls) => [...ls, {
      kind: "text", id, text: textInput.trim(), color: "#ffffff", weight: "bold",
      x: 0, y: 0, scale: 1, rotate: 0,
    }]);
    setTextInput("");
    setSelectedId(id);
  };

  const applyPreset = (p: Preset) => {
    haptic("medium");
    setBg(p.bg);
    if (p.bg2) { setUseGradient(true); setGradient2(p.bg2); } else { setUseGradient(false); }
    const id = uid();
    setLayers([{ kind: "emoji", id, emoji: p.emoji, x: 0, y: 0, scale: 1.6, rotate: 0 }]);
    setSelectedId(null);
  };

  const updateSelected = (patch: Partial<Layer>) => {
    if (!selectedId) return;
    setLayers((ls) => ls.map((l) => (l.id === selectedId ? { ...l, ...patch } as Layer : l)));
  };

  const removeLayer = (id: string) => {
    haptic("warning");
    setLayers((ls) => ls.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = async () => {
    if (!stageRef.current) return;
    setSaving(true);
    haptic("medium");
    try {
      setSelectedId(null);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const dataUrl = await toPng(stageRef.current, { pixelRatio: 2, cacheBust: true, skipFonts: true });
      const blob = await (await fetch(dataUrl)).blob();
      onSave(blob);
      onClose();
    } catch (err) {
      console.error("Cover render failed", err);
    } finally {
      setSaving(false);
    }
  };

  const background = useGradient
    ? `linear-gradient(135deg, hsl(${bg}), hsl(${gradient2}))`
    : `hsl(${bg})`;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[88dvh] w-full p-0 border-0 bg-background rounded-t-3xl [&>button.absolute]:hidden"
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
          >
            <p className="text-base font-bold tracking-tight">Cover Studio</p>
            <Button size="sm" onClick={handleSave} disabled={saving} className="glow-sm rounded-full px-4">
              {saving ? "Saving…" : <><Check className="h-4 w-4 mr-1" /> Done</>}
            </Button>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Stage */}
            <div className="flex items-center justify-center px-4 pb-4">
              <div
                ref={stageRef}
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
                className="relative rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  width: "min(92vw, 380px)",
                  aspectRatio: "1 / 1",
                  background,
                }}
              >
                {layers.map((l) => {
                  const isSel = l.id === selectedId;
                  return (
                    <motion.div
                      key={l.id}
                      drag
                      dragMomentum={false}
                      onDragStart={() => setSelectedId(l.id)}
                      onDragEnd={(_, info) => {
                        setLayers((ls) =>
                          ls.map((x) => (x.id === l.id ? { ...x, x: x.x + info.offset.x, y: x.y + info.offset.y } : x)),
                        );
                      }}
                      onTap={() => { haptic("selection"); setSelectedId(l.id); }}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        x: l.x,
                        y: l.y,
                        translateX: "-50%",
                        translateY: "-50%",
                        rotate: l.rotate,
                        scale: l.scale,
                        cursor: "grab",
                        touchAction: "none",
                      }}
                      whileDrag={{ cursor: "grabbing" }}
                      className={isSel ? "outline-dashed outline-2 outline-white/80 outline-offset-[6px] rounded-md relative" : "relative"}
                    >
                      {l.kind === "emoji" ? (
                        <span style={{ fontSize: 64, lineHeight: 1, userSelect: "none" }}>{l.emoji}</span>
                      ) : (
                        <span
                          className={weightClass(l.weight)}
                          style={{
                            color: l.color,
                            fontSize: 32,
                            letterSpacing: "-0.02em",
                            textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.text}
                        </span>
                      )}

                      {isSel && (
                        <>
                          {/* Delete badge */}
                          <button
                            type="button"
                            onPointerDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                            className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center ring-2 ring-background"
                            aria-label="Delete layer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {/* Resize handle (drag to scale) */}
                          <motion.button
                            type="button"
                            drag
                            dragMomentum={false}
                            onPointerDown={(e) => e.stopPropagation()}
                            onDrag={(_, info) => {
                              const delta = (info.delta.x + info.delta.y) / 200;
                              updateSelected({ scale: Math.max(0.4, Math.min(4, l.scale + delta)) } as any);
                            }}
                            className="absolute -bottom-3 -right-3 h-7 w-7 rounded-full bg-background text-foreground shadow-lg flex items-center justify-center ring-2 ring-white/80 cursor-nwse-resize"
                            aria-label="Resize"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 10L10 2M6 10H10V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </motion.button>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Segmented tab strip */}
            <div className="px-4">
              <div className="rounded-full bg-secondary/60 p-1 flex">
                {TAB_META.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { haptic("selection"); setTab(t.id); }}
                      className={`flex-1 h-9 rounded-full text-xs font-semibold transition-all ${
                        active
                          ? "bg-card text-foreground ring-1 ring-primary/40 shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div className="px-4 py-4 space-y-4">
              {tab === "presets" && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">One tap, instant cover</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className="aspect-square rounded-2xl flex items-end justify-center p-2 relative overflow-hidden transition-transform active:scale-95 ring-1 ring-border"
                        style={{
                          background: p.bg2
                            ? `linear-gradient(135deg, hsl(${p.bg}), hsl(${p.bg2}))`
                            : `hsl(${p.bg})`,
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-4xl">{p.emoji}</span>
                        <span className="relative z-10 text-[11px] font-bold text-white drop-shadow">
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "color" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Background color</p>
                    <div className="flex gap-2 flex-wrap items-center">
                      {PRESET_BGS.map((c) => (
                        <button
                          key={c}
                          onClick={() => { haptic("selection"); setBg(c); }}
                          className={`h-9 w-9 rounded-full border-2 transition-transform ${bg === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ background: `hsl(${c})` }}
                        />
                      ))}
                      <label className="h-9 w-9 rounded-full border-2 border-foreground/30 overflow-hidden relative cursor-pointer bg-secondary">
                        <input
                          type="color"
                          onChange={(e) => setBg(hexToHsl(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Plus className="h-4 w-4 absolute inset-0 m-auto text-muted-foreground" />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold">Gradient</span>
                    <Switch checked={useGradient} onCheckedChange={setUseGradient} aria-label="Toggle gradient" />
                  </div>
                  {useGradient && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fades to</p>
                      <div className="flex gap-2 flex-wrap items-center">
                        {PRESET_BGS.map((c) => (
                          <button
                            key={`g-${c}`}
                            onClick={() => { haptic("selection"); setGradient2(c); }}
                            className={`h-8 w-8 rounded-full border-2 ${gradient2 === c ? "border-foreground" : "border-transparent"}`}
                            style={{ background: `hsl(${c})` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "stickers" && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tap to add — stack as many as you like</p>
                  <div className="grid grid-cols-6 gap-2">
                    {STICKERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addEmoji(s)}
                        className="aspect-square rounded-xl bg-secondary/60 text-2xl flex items-center justify-center hover:bg-secondary transition active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                    {/* Custom + tile */}
                    <div className="aspect-square rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center text-primary">
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste or type any emoji…"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customEmoji.trim()) {
                          e.preventDefault();
                          addEmoji(customEmoji.trim());
                          setCustomEmoji("");
                        }
                      }}
                      className="h-10"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!customEmoji.trim()}
                      onClick={() => { addEmoji(customEmoji.trim()); setCustomEmoji(""); }}
                      className="rounded-full px-4"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Drag to move · pinch (or drag the white corner) to resize · tap the red × to delete.
                  </p>
                </div>
              )}

              {tab === "text" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Text overlay</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add text…"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addText(); } }}
                        className="h-10"
                      />
                      <Button type="button" onClick={addText} size="sm" disabled={!textInput.trim()} className="rounded-full px-4">
                        Add
                      </Button>
                    </div>
                  </div>

                  {selectedText && (
                    <>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Weight</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(["bold", "medium", "light"] as TextWeight[]).map((w) => {
                            const active = selectedText.weight === w;
                            return (
                              <button
                                key={w}
                                type="button"
                                onClick={() => updateSelected({ weight: w } as any)}
                                className={`h-10 rounded-xl text-sm transition-all ${weightClass(w)} ${
                                  active
                                    ? "bg-card ring-1 ring-primary text-foreground"
                                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {w[0].toUpperCase() + w.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Color</span>
                        <input
                          type="color"
                          value={selectedText.color}
                          onChange={(e) => updateSelected({ color: e.target.value } as any)}
                          className="h-8 w-12 rounded border-0 bg-transparent cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                  {!selectedText && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      Tap a text layer on the cover to change weight & color.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CoverStudio;
