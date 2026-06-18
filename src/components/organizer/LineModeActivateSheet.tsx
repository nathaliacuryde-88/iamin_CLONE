import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineStatus, STATUS_META } from "@/hooks/useLineMode";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (status: LineStatus, note: string) => void;
  loading?: boolean;
}

const ORDER: LineStatus[] = ["walk_in", "short_wait", "long_wait", "closed"];
const SUB: Record<LineStatus, string> = {
  walk_in: "No wait — come now",
  short_wait: "Around 15–30 mins",
  long_wait: "45 min or more",
  closed: "At capacity for tonight",
};

const LineModeActivateSheet = ({ open, onOpenChange, onConfirm, loading }: Props) => {
  const [status, setStatus] = useState<LineStatus | null>(null);
  const [note, setNote] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>What's the door situation right now?</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {ORDER.map((s) => {
            const meta = STATUS_META[s];
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${meta.tint} ${active ? meta.border + " ring-2 ring-offset-0" : "border-transparent"}`}
              >
                <div className="text-2xl">{meta.emoji}</div>
                <div className="text-sm font-bold mt-1">{meta.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{SUB[s]}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional) — e.g. VIP entrance open, main door busy"
            maxLength={140}
          />
        </div>
        <Button
          disabled={!status || loading}
          className="w-full mt-4 glow-sm"
          onClick={() => status && onConfirm(status, note.trim())}
        >
          Go live →
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default LineModeActivateSheet;
