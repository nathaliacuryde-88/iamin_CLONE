import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ImagePlus, X, Palette, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/imageCompress";
import { useSendBirthdayCard, type TextBoxStyle } from "@/hooks/useBirthdayCards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BIRTHDAY_ILLUSTRATIONS } from "@/lib/birthdayIllustrations";

const EMOJI_OPTIONS = ["🎂", "🎉", "🎁", "🥳", "🍰", "🎈", "✨", "💖", "🌟", "🥂", "🍾", "🎊"];
const COLOR_OPTIONS = [
  { id: "from-primary to-accent", label: "Aurora", preview: "linear-gradient(135deg, hsl(263 70% 60%), hsl(330 80% 65%))" },
  { id: "from-pink-500 to-orange-400", label: "Sunset", preview: "linear-gradient(135deg, hsl(330 80% 60%), hsl(25 90% 60%))" },
  { id: "from-blue-500 to-cyan-400", label: "Ocean", preview: "linear-gradient(135deg, hsl(220 80% 60%), hsl(190 80% 60%))" },
  { id: "from-emerald-400 to-lime-300", label: "Mint", preview: "linear-gradient(135deg, hsl(160 70% 55%), hsl(80 80% 70%))" },
  { id: "from-yellow-400 to-rose-400", label: "Confetti", preview: "linear-gradient(135deg, hsl(45 90% 60%), hsl(0 80% 70%))" },
  { id: "from-violet-600 to-fuchsia-500", label: "Neon", preview: "linear-gradient(135deg, hsl(265 80% 55%), hsl(295 85% 60%))" },
];

const TEXT_BOX_STYLES: { id: TextBoxStyle; label: string }[] = [
  { id: "none", label: "None" },
  { id: "solid", label: "Solid" },
  { id: "translucent", label: "Glass" },
];

const textBoxClass = (style: TextBoxStyle, solidColor?: string) => {
  switch (style) {
    case "solid":
      return "text-white px-3 py-2 rounded-lg"; // bg applied inline so the picker can change it
    case "translucent":
      return "bg-white/25 backdrop-blur-md text-white px-3 py-2 rounded-lg ring-1 ring-white/30";
    default: return "";
  }
};

const SOLID_COLORS = [
  "#000000D9", "#7C3AEDE6", "#EC4899E6", "#0EA5E9E6", "#F59E0BE6", "#10B981E6",
];

interface Friend {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  friend: Friend;
  birthdayDate: string;
}

const BirthdayCardComposer = ({ open, onOpenChange, friend, birthdayDate }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emoji, setEmoji] = useState<string | null>("🎂");
  const [emojiScale, setEmojiScale] = useState(1);
  const [emojiPos, setEmojiPos] = useState({ x: 0, y: 0 });
  const [emojiSelected, setEmojiSelected] = useState(false);
  const [color, setColor] = useState(COLOR_OPTIONS[0].id);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
  const [uploadingBg, setUploadingBg] = useState(false);
  const [textBoxStyle, setTextBoxStyle] = useState<TextBoxStyle>("translucent");
  const [solidColor, setSolidColor] = useState<string>(SOLID_COLORS[0]);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [libraryOpen, setLibraryOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const send = useSendBirthdayCard();

  const selectedColor = COLOR_OPTIONS.find((c) => c.id === color)!;
  const textBoxEnabled = textBoxStyle !== "none";

  // Cards can only be sent on the recipient's actual birthday (month + day).
  const todayMmDd = new Date().toISOString().slice(5, 10);
  const targetMmDd = (birthdayDate ?? "").slice(5, 10);
  const isBirthdayToday = !!targetMmDd && todayMmDd === targetMmDd;


  const handleBgPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw || !user) return;
    setUploadingBg(true);
    try {
      const file = await compressImage(raw);
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("birthday-cards")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setBgPath(path);
      setBgPreview(URL.createObjectURL(file));
    } catch (err: any) {
      toast({ title: "Couldn't upload image", description: err.message, variant: "destructive" });
    } finally {
      setUploadingBg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePickIllustration = async (src: string, id: string) => {
    if (!user) return;
    setUploadingBg(true);
    setLibraryOpen(false);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = await compressImage(new File([blob], `${id}.png`, { type: blob.type || "image/png" }));
      const path = `${user.id}/${Date.now()}-${id}.${file.name.split(".").pop() ?? "jpg"}`;
      const { error } = await supabase.storage
        .from("birthday-cards")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setBgPath(path);
      setBgPreview(URL.createObjectURL(file));
    } catch (err: any) {
      toast({ title: "Couldn't use that illustration", description: err.message, variant: "destructive" });
    } finally {
      setUploadingBg(false);
    }
  };

  const removeBg = () => {
    setBgPath(null);
    setBgPreview(null);
  };

  const handleSend = async () => {
    setSending(true);
    const res = await send({
      recipientId: friend.user_id,
      birthdayDate,
      emoji: emoji ?? "🎉",
      message,
      color,
      backgroundImageUrl: bgPath,
      textBoxEnabled,
      textBoxStyle,
    });
    setSending(false);
    if (res.ok) {
      setMessage("");
      removeBg();
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-primary/20 max-w-lg mx-auto max-h-[90dvh] overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Send a birthday card</SheetTitle>
          <SheetDescription>
            For {friend.display_name ?? "your friend"} — they'll get a confetti reveal.
          </SheetDescription>
        </SheetHeader>

        {/* Preview card */}
        <div
          ref={previewRef}
          onPointerDown={(e) => {
            // Tap outside emoji to deselect
            if ((e.target as HTMLElement).closest("[data-emoji-handle]")) return;
            setEmojiSelected(false);
          }}
          className="mt-4 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden min-h-[280px] flex flex-col items-center justify-center select-none"
          style={!bgPreview ? { background: selectedColor.preview } : undefined}
        >
          {bgPreview && (
            <motion.img
              src={bgPreview}
              alt=""
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => setBgOffset((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))}
              style={{ x: bgOffset.x, y: bgOffset.y }}
              className="absolute inset-0 w-[140%] h-[140%] object-cover -left-[20%] -top-[20%] cursor-grab active:cursor-grabbing"
              draggable={false}
            />
          )}
          {bgPreview && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}
          <div className="relative z-10 flex flex-col items-center pointer-events-none">
            {emoji && (
              <motion.div
                data-emoji-handle
                drag
                dragMomentum={false}
                onDragEnd={(_, info) =>
                  setEmojiPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))
                }
                onTap={(e) => { e.stopPropagation?.(); setEmojiSelected((s) => !s); }}
                style={{ x: emojiPos.x, y: emojiPos.y, fontSize: `${48 * emojiScale}px` }}
                className="relative mb-2 drop-shadow cursor-grab active:cursor-grabbing pointer-events-auto leading-none"
              >
                <span>{emoji}</span>
                {emojiSelected && (
                  <button
                    type="button"
                    data-emoji-trash
                    // Use onPointerDown so it fires before motion's tap/drag handlers
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setEmoji(null);
                      setEmojiSelected(false);
                    }}
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md ring-2 ring-background z-20"
                    aria-label="Remove emoji"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            )}
            <motion.div
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => setTextPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))}
              style={{ x: textPos.x, y: textPos.y }}
              className="pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col items-center"
            >
              <div
                className={cn("font-bold text-lg drop-shadow", textBoxEnabled ? textBoxClass(textBoxStyle) : "text-white")}
                style={textBoxStyle === "solid" ? { backgroundColor: solidColor } : undefined}
              >
                Happy birthday, {friend.display_name ?? "friend"}!
              </div>
              {message.trim() ? (
                <p
                  className={cn("text-sm mt-3 italic max-w-[80%]", textBoxEnabled ? textBoxClass(textBoxStyle) : "text-white/95 drop-shadow")}
                  style={textBoxStyle === "solid" ? { backgroundColor: solidColor } : undefined}
                >
                  "{message.trim()}"
                </p>
              ) : (
                <p className="text-white/70 text-xs mt-3 drop-shadow">Add a message below ↓</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Emoji controls (size + restore) */}
        {emoji ? (
          <div className="mt-3 flex items-center gap-3 px-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-10">Size</span>
            <Slider
              value={[emojiScale]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={(v) => setEmojiScale(v[0])}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => { setEmojiPos({ x: 0, y: 0 }); setEmojiScale(1); }}
              className="text-[10px] text-primary hover:underline"
            >
              Reset
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-6 gap-2">
            {EMOJI_OPTIONS.slice(0, 6).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmoji(e); setEmojiPos({ x: 0, y: 0 }); setEmojiScale(1); }}
                className="h-11 rounded-xl text-2xl border border-border/50 hover:border-primary/40 active:scale-95"
              >
                {e}
              </button>
            ))}
          </div>
        )}


        {/* Background image */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background image</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBgPick} />
          {bgPreview ? (
            <div className="flex items-center gap-2">
              <img src={bgPreview} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <Button variant="ghost" size="sm" onClick={removeBg}>
                <X className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingBg}>
                <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
                {uploadingBg ? "Uploading…" : "Upload photo"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)} disabled={uploadingBg}>
                <Palette className="h-3.5 w-3.5 mr-1.5" />
                Illustration library
              </Button>
            </div>
          )}
          {libraryOpen && (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-2">
              {BIRTHDAY_ILLUSTRATIONS.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => handlePickIllustration(img.src, img.id)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-border/50 hover:border-primary transition-all active:scale-95 bg-background"
                >
                  <img src={img.src} alt={img.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text box style — IG-style legibility option */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Text background</p>
          </div>
          <div className="grid grid-cols-3 rounded-xl border border-border/50 overflow-hidden">
            {TEXT_BOX_STYLES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTextBoxStyle(s.id)}
                className={cn(
                  "h-10 text-xs font-medium transition-all",
                  idx > 0 && "border-l border-border/50",
                  textBoxStyle === s.id ? "bg-primary/20 text-foreground" : "bg-transparent text-muted-foreground hover:bg-muted/40"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {textBoxStyle === "solid" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Color</span>
              <div className="flex gap-1.5 flex-1">
                {SOLID_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSolidColor(c)}
                    aria-label={`Pick ${c}`}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      solidColor === c ? "border-primary scale-110" : "border-border/40 active:scale-95",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="h-7 w-7 rounded-full border-2 border-border/40 overflow-hidden cursor-pointer relative">
                  <input
                    type="color"
                    value={solidColor.length === 9 ? solidColor.slice(0, 7) : solidColor}
                    onChange={(e) => setSolidColor(e.target.value + "E6")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="absolute inset-0 bg-gradient-to-br from-pink-500 via-yellow-400 to-cyan-400" />
                </label>
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Drag the text on the card to reposition it.
          </p>
        </div>

        {/* Emoji picker */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emoji</p>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn(
                  "h-11 rounded-xl text-2xl transition-all border",
                  emoji === e
                    ? "bg-primary/15 border-primary scale-105 glow-sm"
                    : "border-border/50 hover:border-primary/40 active:scale-95",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker (only when no background image) */}
        {!bgPreview && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background color</p>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-label={c.label}
                  className={cn(
                    "h-10 rounded-xl transition-all border-2",
                    color === c.id ? "border-primary scale-105 glow-sm" : "border-transparent active:scale-95",
                  )}
                  style={{ background: c.preview }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Message (optional)</p>
          <Textarea
            value={message}
            maxLength={200}
            placeholder="Write something sweet…"
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-1">{message.length}/200</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sticky bottom-0 pb-2 bg-background/95 backdrop-blur">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || uploadingBg || !isBirthdayToday}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-sm"
          >
            {sending ? "Sending…" : isBirthdayToday ? "Send card 🎉" : "Wait for the day"}
          </Button>
        </div>
        {!isBirthdayToday && targetMmDd && (
          <p className="text-[11px] text-muted-foreground text-center -mt-1">
            You can send this card on {(() => {
              const [m, d] = targetMmDd.split("-").map(Number);
              return new Date(2000, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            })()} 🎂
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default BirthdayCardComposer;
