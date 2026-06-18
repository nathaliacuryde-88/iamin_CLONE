import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseISO } from "date-fns";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Share2, Download, Loader2 } from "lucide-react";
import { buildReceipt, formatMoney, type NightReceipt as NR } from "@/lib/buildReceipt";
import { format } from "@/lib/dateFormat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 text-[13px] leading-snug">
    <span className="text-black/70">{label}</span>
    <span className="font-semibold text-black text-right [overflow-wrap:anywhere]">{value}</span>
  </div>
);

const Divider = () => (
  <div
    className="my-2"
    style={{
      backgroundImage:
        "repeating-linear-gradient(to right, rgba(0,0,0,0.4) 0 4px, transparent 4px 8px)",
      height: 1,
    }}
  />
);

const verdictGlyph = (v: NR["verdict"]) =>
  v === "fire" ? "🔥 FIRE" : v === "mid" ? "😐 MID" : v === "flop" ? "💀 FLOP" : "—";

const NightReceipt = ({ eventId, open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<NR | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    buildReceipt(eventId, user.id)
      .then((r) => !cancelled && setData(r))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, eventId, user]);

  const exportPng = async (): Promise<string | null> => {
    const node = document.getElementById("night-receipt-card");
    if (!node) return null;
    try {
      setBusy(true);
      const mod = await import("html-to-image");
      const url = await mod.toPng(node, { pixelRatio: 2, backgroundColor: "#0b0b10" });
      return url as string;
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message, variant: "destructive" });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const url = await exportPng();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `receipt-${eventId}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: data?.eventName ?? "Receipt" });
        return;
      }
    } catch {}
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${eventId}.png`;
    a.click();
  };

  const handleDownload = async () => {
    const url = await exportPng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${eventId}.png`;
    a.click();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh] overflow-y-auto p-0 bg-background">
        <DrawerTitle className="sr-only">
          {t("receipt.title", { defaultValue: "Morning-after receipt" })}
        </DrawerTitle>
        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {t("receipt.title", { defaultValue: "Morning-after receipt" })}
          </h2>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={handleDownload} disabled={busy || !data} aria-label="Download">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={handleShare} disabled={busy || !data} aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center px-4 pb-8 pt-2">
          {loading || !data ? (
            <div className="w-[340px] h-[520px] rounded bg-muted/40 animate-pulse" />
          ) : (
            <div
              id="night-receipt-card"
              className="relative w-[340px] bg-[#f6f3ea] text-black px-6 pt-7 pb-9 shadow-2xl"
              style={{
                fontFamily: "'IBM Plex Mono', 'Menlo', 'Courier New', monospace",
                WebkitMaskImage:
                  "radial-gradient(circle 6px at 6px 0, transparent 5px, #000 6px), radial-gradient(circle 6px at 6px 100%, transparent 5px, #000 6px)",
                WebkitMaskComposite: "source-over",
                maskImage:
                  "radial-gradient(circle 6px at 6px 0, transparent 5px, #000 6px), radial-gradient(circle 6px at 6px 100%, transparent 5px, #000 6px)",
              }}
            >
              {/* Serrated edges */}
              <div
                className="absolute inset-x-0 -top-2 h-3"
                style={{
                  backgroundImage:
                    "radial-gradient(circle 4px at 8px 100%, #f6f3ea 50%, transparent 51%)",
                  backgroundSize: "16px 12px",
                  backgroundRepeat: "repeat-x",
                }}
              />
              <div
                className="absolute inset-x-0 -bottom-2 h-3"
                style={{
                  backgroundImage:
                    "radial-gradient(circle 4px at 8px 0, #f6f3ea 50%, transparent 51%)",
                  backgroundSize: "16px 12px",
                  backgroundRepeat: "repeat-x",
                }}
              />

              <div className="text-center">
                <p className="text-[11px] tracking-[0.35em] text-black/60">I AM (IN)</p>
                <p className="text-[10px] tracking-[0.25em] text-black/50 mt-0.5">
                  ★ MORNING-AFTER RECEIPT ★
                </p>
                <h3 className="mt-3 text-lg font-bold uppercase tracking-tight leading-tight">
                  {data.eventName}
                </h3>
                <p className="text-[11px] text-black/60 mt-0.5">
                  {data.date && format(parseISO(data.date), "EEE d MMM yyyy")}
                  {data.city ? ` · ${data.city}` : ""}
                </p>
              </div>

              <Divider />

              <Row label="People going" value={data.attendeesCount} />
              <Row label="Photos in capsule" value={data.photosCount} />

              <Divider />


              {data.prediction && (
                <>
                  <p className="text-[11px] text-black/60 uppercase tracking-widest">
                    🔮 Sealed prediction
                  </p>
                  <p className="text-[13px] italic mt-1 leading-snug">
                    "{data.prediction}"
                  </p>
                  <Divider />
                </>
              )}

              {data.tableTotalCents > 0 && (
                <>
                  <Row
                    label="Table total"
                    value={formatMoney(data.tableTotalCents, data.currency)}
                  />
                  <Row
                    label="Your share"
                    value={
                      <span className="text-base">
                        {formatMoney(data.myShareCents, data.currency)}
                      </span>
                    }
                  />
                  <Divider />
                </>
              )}

              <Row
                label="Exit poll"
                value={
                  <span className="inline-flex gap-2 items-baseline">
                    <span>🔥 {data.verdictCounts.fire}</span>
                    <span>😐 {data.verdictCounts.mid}</span>
                    <span>💀 {data.verdictCounts.flop}</span>
                  </span>
                }
              />
              <Row label="Verdict" value={verdictGlyph(data.verdict)} />

              <Divider />

              <div className="text-center mt-2">
                <p className="text-[10px] tracking-[0.25em] text-black/50">— TIP —</p>
                <p className="text-2xl mt-1">🔥</p>
                <p className="text-[10px] mt-3 text-black/50">
                  THANK YOU · COME AGAIN · #{eventId.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NightReceipt;
