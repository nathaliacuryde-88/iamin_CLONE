import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, differenceInDays } from "date-fns";
import { Download } from "lucide-react";

interface Props {
  friendUserId: string;
  friendName: string;
  /** kept for backwards-compat, no longer rendered */
  friendAvatar?: string | null;
}

/**
 * Friendship Receipt — share-worthy "paper receipt" of two friends' shared
 * history. Perforated edges, monospace, dashed dividers, and two animated
 * emojis instead of avatars.
 */
const FriendshipReceiptCard = ({ friendUserId, friendName }: Props) => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["friendship-receipt", user?.id, friendUserId],
    enabled: !!user && !!friendUserId && user!.id !== friendUserId,
    queryFn: async () => {
      const [{ data: mine }, { data: theirs }] = await Promise.all([
        supabase.from("attendees").select("event_id").eq("user_id", user!.id).eq("status", "going"),
        supabase.from("attendees").select("event_id").eq("user_id", friendUserId).eq("status", "going"),
      ]);
      const mineSet = new Set((mine ?? []).map((r) => r.event_id));
      const sharedIds = (theirs ?? []).map((r) => r.event_id).filter((id) => mineSet.has(id));
      if (sharedIds.length === 0) {
        return { shared: 0, firstDate: null as string | null, lastDate: null as string | null, myHosted: 0, theirHosted: 0, topVibe: null as string | null };
      }
      const { data: events } = await supabase
        .from("events")
        .select("id, date, created_by, vibe_category")
        .in("id", sharedIds);
      const list = (events ?? []).filter((e) => e.date);
      list.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

      const vibeCounts = new Map<string, number>();
      for (const e of list) {
        const v = (e as any).vibe_category as string | null;
        if (v) vibeCounts.set(v, (vibeCounts.get(v) ?? 0) + 1);
      }
      const topVibe = [...vibeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        shared: list.length,
        firstDate: list[0]?.date ?? null,
        lastDate: list[list.length - 1]?.date ?? null,
        myHosted: list.filter((e) => e.created_by === user!.id).length,
        theirHosted: list.filter((e) => e.created_by === friendUserId).length,
        topVibe,
      };
    },
  });

  const tier = useMemo(() => {
    if (!data || data.shared === 0) return null;
    if (data.shared >= 10) return { headline: "INSEPARABLE", sub: "Top-tier duo" };
    if (data.shared >= 5) return { headline: "REAL ONES", sub: "Locked in" };
    if (data.shared >= 2) return { headline: "BUILDING HISTORY", sub: "Going somewhere" };
    return { headline: "FIRST CHAPTER", sub: "Just getting started" };
  }, [data]);

  // Pick two emojis to represent the duo — deterministic per friend.
  const emojiPair = useMemo(() => {
    const pairs = [
      ["🍻", "✨"],
      ["🥂", "🌙"],
      ["🪩", "🎶"],
      ["🌮", "🍹"],
      ["🔥", "💫"],
      ["🫶", "🥳"],
    ];
    const idx = (friendUserId.charCodeAt(0) + friendUserId.charCodeAt(1 % friendUserId.length || 0)) % pairs.length;
    return pairs[idx];
  }, [friendUserId]);

  // Paper-receipt surface: cream paper with perforated top/bottom edges via SVG mask.
  // Stays light-on-dark so it pops in the feed like a Polaroid.
  const perforationMask =
    "radial-gradient(circle 6px at 6px 6px, transparent 5px, black 5px) top left / 12px 12px repeat-x," +
    "radial-gradient(circle 6px at 6px 6px, transparent 5px, black 5px) bottom left / 12px 12px repeat-x," +
    "linear-gradient(black, black) center / 100% calc(100% - 12px) no-repeat";

  const receiptStyle: React.CSSProperties = {
    background:
      "linear-gradient(180deg, hsl(40 40% 96%) 0%, hsl(40 30% 92%) 100%)",
    color: "hsl(20 20% 18%)",
    fontFamily:
      'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
    WebkitMaskImage: perforationMask,
    maskImage: perforationMask,
    WebkitMaskComposite: "source-over",
    boxShadow:
      "0 30px 60px -20px hsl(var(--primary) / 0.25), 0 8px 24px -8px hsl(0 0% 0% / 0.4)",
  };

  const Divider = () => (
    <div
      aria-hidden
      className="my-3 h-px w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, hsl(20 20% 18% / 0.45) 0 4px, transparent 4px 8px)",
      }}
    />
  );

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="uppercase tracking-wider opacity-70">{label}</span>
      <span
        aria-hidden
        className="flex-1 mx-1 self-end leading-none"
        style={{
          borderBottom: "1px dotted hsl(20 20% 18% / 0.45)",
          transform: "translateY(-3px)",
        }}
      />
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );

  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "transparent",
      });
      const link = document.createElement("a");
      link.download = `iamin-receipt-${friendName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Receipt export failed", err);
    }
  };

  // Empty state
  if (!data || data.shared === 0 || !tier) {
    return (
      <div ref={receiptRef} className="relative px-7 py-8 text-center animate-fade-in" style={receiptStyle}>
        <p className="text-[11px] tracking-[0.18em] font-black uppercase opacity-80">
          I am in
        </p>
        <Divider />
        <div className="flex items-center justify-center gap-3 my-2">
          <span
            className="text-4xl inline-block"
            style={{ animation: "wiggle 2.4s ease-in-out infinite" }}
          >
            🫠
          </span>
        </div>
        <p className="text-sm font-bold uppercase tracking-wide mt-2">
          You &amp; {friendName}
        </p>
        <p className="text-[12px] opacity-70 mt-3 max-w-[240px] mx-auto leading-relaxed">
          No receipts yet. The night is young 🌙 — go make a memory.
        </p>
        <Divider />
        <p className="text-[10px] tracking-[0.3em] opacity-50 mt-1">* * * * *</p>
      </div>
    );
  }

  const days = data.firstDate ? differenceInDays(new Date(), parseISO(data.firstDate)) : 0;

  return (
    <div className="animate-fade-in flex flex-col items-center">
      <div ref={receiptRef} className="relative px-7 py-8 w-full" style={receiptStyle}>
        {/* Header — app name */}
        <div className="text-center">
          <p className="text-[15px] tracking-[0.1em] font-black uppercase">
            I am in
          </p>
          <p className="text-[10px] tracking-[0.25em] opacity-50 mt-1">
            FRIENDSHIP RECEIPT · NO. {friendUserId.slice(0, 6).toUpperCase()}
          </p>
          <p className="text-[10px] tracking-widest opacity-50 mt-0.5">
            {format(new Date(), "dd MMM yyyy").toUpperCase()}
          </p>
        </div>

        <Divider />

        {/* Duo + animated emojis */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 my-1">
            <span
              className="text-4xl inline-block"
              style={{ animation: "wiggle 2.6s ease-in-out infinite" }}
            >
              {emojiPair[0]}
            </span>
            <span className="text-2xl opacity-50 font-light">&amp;</span>
            <span
              className="text-4xl inline-block"
              style={{ animation: "wiggle 2.6s ease-in-out infinite 0.4s" }}
            >
              {emojiPair[1]}
            </span>
          </div>
          <p className="text-base font-black uppercase tracking-wide mt-3">
            You &amp; {friendName}
          </p>
          <p className="text-[11px] tracking-[0.2em] font-bold mt-1 opacity-80">
            {tier.headline}
          </p>
          <p className="text-[11px] opacity-60 italic">— {tier.sub} —</p>
        </div>

        <Divider />

        {/* Itemised lines */}
        <div className="space-y-2">
          <Row label="Shared events" value={`× ${data.shared}`} />
          <Row label="You hosted" value={`× ${data.myHosted}`} />
          <Row label="They hosted" value={`× ${data.theirHosted}`} />
          {data.topVibe && <Row label="Favorite vibe" value={data.topVibe} />}
          {data.firstDate && <Row label="Since" value={format(parseISO(data.firstDate), "MMM yyyy")} />}
          {days > 0 && <Row label="Days strong" value={days} />}
        </div>

        <Divider />

        {/* Total */}
        <div className="flex items-baseline justify-between text-[13px] font-black uppercase">
          <span>Total memories</span>
          <span className="text-xl tabular-nums">
            {data.shared + data.myHosted + data.theirHosted}
          </span>
        </div>

        <Divider />

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] font-bold opacity-70">
            THANK YOU FOR THE MEMORIES
          </p>
          <p className="text-[10px] tracking-[0.3em] opacity-50 mt-1">
            * * * * *
          </p>
        </div>
      </div>

      {/* Download button — centered, below the receipt */}
      <button
        type="button"
        onClick={handleDownload}
        aria-label="Download receipt"
        className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download className="h-3.5 w-3.5" /> Save receipt
      </button>
    </div>
  );
};

export default FriendshipReceiptCard;
