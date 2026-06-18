import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Pencil, Trash2 } from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";

type Mode =
  | { kind: "confirm-new"; start: Date; end: Date }
  | { kind: "edit-existing"; rangeDates: string[]; reason?: string | null }
  | { kind: "confirm-replace"; oldDates: string[]; start: Date; end: Date }
  | null;

interface Props {
  mode: Mode;
  onClose: () => void;
  onConfirmNew: (reason?: string) => void;
  onConfirmReplace: (reason?: string) => void;
  onStartEdit: () => void;
  onErase: () => void;
  onEditRange: () => void;
  onSaveReason?: (reason: string) => void;
}


const formatRange = (start: Date, end: Date) => {
  const [a, b] = start <= end ? [start, end] : [end, start];
  if (differenceInCalendarDays(b, a) === 0) {
    return format(a, "EEE, MMM d");
  }
  return `${format(a, "MMM d")} → ${format(b, "MMM d")}`;
};

const dayCount = (start: Date, end: Date) => {
  const [a, b] = start <= end ? [start, end] : [end, start];
  return differenceInCalendarDays(b, a) + 1;
};

const BlockRangeSheet = ({ mode, onClose, onConfirmNew, onConfirmReplace, onStartEdit, onErase, onEditRange, onSaveReason }: Props) => {
  const open = mode !== null;
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (mode?.kind === "confirm-new" || mode?.kind === "confirm-replace") {
      setReason("");
    } else if (mode?.kind === "edit-existing") {
      setReason(mode.reason ?? "");
    }
  }, [mode]);


  let title = "";
  let description = "";
  let body: React.ReactNode = null;

  if (mode?.kind === "confirm-new") {
    const n = dayCount(mode.start, mode.end);
    title = `Mark ${formatRange(mode.start, mode.end)} unavailable?`;
    description = n === 1 ? "1 day" : `${n} days`;
    body = (
      <div className="space-y-3 mt-4">
        <Input
          autoFocus={false}
          placeholder="Reason (optional) — e.g. travel, work"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 80))}
        />
        <Button
          onClick={() => onConfirmNew(reason.trim() || undefined)}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-sm"
        >
          <Check className="h-4 w-4 mr-1.5" /> Confirm
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onEditRange}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    );
  } else if (mode?.kind === "edit-existing") {
    const start = parseISO(mode.rangeDates[0]);
    const end = parseISO(mode.rangeDates[mode.rangeDates.length - 1]);
    const n = mode.rangeDates.length;
    title = `Unavailable ${formatRange(start, end)}`;
    description = n === 1 ? "1 day blocked" : `${n} days blocked`;
    body = (
      <div className="space-y-3 mt-4">
        <Input
          placeholder="Reason (optional) — e.g. travel, work"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 80))}
          onBlur={() => {
            const next = reason.trim();
            if ((mode.reason ?? "") !== next) onSaveReason?.(next);
          }}
        />
        <Button variant="outline" className="w-full justify-start" onClick={onStartEdit}>
          <Pencil className="h-4 w-4 mr-2" /> Edit dates
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onErase}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Erase
        </Button>
      </div>
    );

  } else if (mode?.kind === "confirm-replace") {
    const n = dayCount(mode.start, mode.end);
    title = `Replace with ${formatRange(mode.start, mode.end)}?`;
    description = n === 1 ? "1 day" : `${n} days`;
    body = (
      <div className="space-y-3 mt-4">
        <Input
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 80))}
        />
        <Button
          onClick={() => onConfirmReplace(reason.trim() || undefined)}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-sm"
        >
          <Check className="h-4 w-4 mr-1.5" /> Confirm
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onEditRange}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-primary/20 max-w-lg mx-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
};

export default BlockRangeSheet;
