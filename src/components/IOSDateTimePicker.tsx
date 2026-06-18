import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { WheelPicker, WheelOption } from "@/components/ui/wheel-picker";
import { cn } from "@/lib/utils";

type Mode = "date" | "time";

interface Props {
  mode: Mode;
  value: string; // "YYYY-MM-DD" or "HH:mm"
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  min?: string; // for date
  max?: string; // for date
  disabled?: boolean;
  triggerClassName?: string;
  /** Default draft date used when opening the picker with an empty value
   *  (avoids the wheel defaulting to today, which causes accidental
   *  "today" birthdays in onboarding). Format: "YYYY-MM-DD". */
  initialDraft?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const MONTHS: WheelOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: pad(i + 1),
  label: format(new Date(2000, i, 1), "MMM"),
}));

const buildDays = (year: number, month: number): WheelOption[] => {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => ({
    value: pad(i + 1),
    label: pad(i + 1),
  }));
};

const buildYears = (min?: string, max?: string): WheelOption[] => {
  // Year wheel always starts at 2026 unless an explicit min is provided.
  const start = min ? Number(min.slice(0, 4)) : 2026;
  const end = max ? Number(max.slice(0, 4)) : Math.max(start + 10, new Date().getFullYear() + 5);
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  return Array.from({ length: hi - lo + 1 }, (_, i) => ({
    value: String(lo + i),
    label: String(lo + i),
  }));
};

const HOURS_12: WheelOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: pad(i + 1),
}));
const MINUTES: WheelOption[] = Array.from({ length: 60 }, (_, i) => ({
  value: pad(i),
  label: pad(i),
}));
const AMPM: WheelOption[] = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

const formatDateDisplay = (v: string) => {
  if (!v) return "";
  const d = parse(v, "yyyy-MM-dd", new Date());
  return isValid(d) ? format(d, "MMM d, yyyy") : v;
};

const formatTimeDisplay = (v: string) => {
  if (!v) return "";
  const t = parse(v.length > 5 ? v.slice(0, 5) : v, "HH:mm", new Date());
  return isValid(t) ? format(t, "h:mm a") : v;
};

export const IOSDateTimePicker: React.FC<Props> = ({
  mode,
  value,
  onChange,
  label,
  placeholder,
  min,
  max,
  disabled,
  triggerClassName,
  initialDraft,
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  // Local draft state (only committed on Apply)
  const today = new Date();

  const [draftDay, setDraftDay] = React.useState("");
  const [draftMonth, setDraftMonth] = React.useState("");
  const [draftYear, setDraftYear] = React.useState("");
  const [draftHour, setDraftHour] = React.useState("");
  const [draftMin, setDraftMin] = React.useState("");
  const [draftAP, setDraftAP] = React.useState<"AM" | "PM">("AM");

  // Initialize draft when opening
  React.useEffect(() => {
    if (!open) return;
    if (mode === "date") {
      let d: Date | null = null;
      if (value) {
        const parsed = parse(value, "yyyy-MM-dd", new Date());
        if (isValid(parsed)) d = parsed;
      }
      if (!d && initialDraft) {
        const parsed = parse(initialDraft, "yyyy-MM-dd", new Date());
        if (isValid(parsed)) d = parsed;
      }
      if (!d) d = today;
      setDraftDay(pad(d.getDate()));
      setDraftMonth(pad(d.getMonth() + 1));
      setDraftYear(String(d.getFullYear()));
    } else {
      let h = today.getHours();
      let m = today.getMinutes();
      if (value) {
        const t = parse(value.length > 5 ? value.slice(0, 5) : value, "HH:mm", new Date());
        if (isValid(t)) {
          h = t.getHours();
          m = t.getMinutes();
        }
      }
      const ap: "AM" | "PM" = h >= 12 ? "PM" : "AM";
      const h12 = ((h + 11) % 12) + 1;
      setDraftHour(String(h12));
      setDraftMin(pad(m));
      setDraftAP(ap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const years = React.useMemo(() => buildYears(min, max), [min, max]);
  const days = React.useMemo(() => {
    const y = Number(draftYear) || today.getFullYear();
    const m = Number(draftMonth) || today.getMonth() + 1;
    return buildDays(y, m);
  }, [draftYear, draftMonth]);

  // Clamp day if month/year changes shorten the month
  React.useEffect(() => {
    if (mode !== "date") return;
    if (!draftDay) return;
    const maxDay = days.length;
    if (Number(draftDay) > maxDay) setDraftDay(pad(maxDay));
  }, [days, draftDay, mode]);

  const handleApply = () => {
    if (mode === "date") {
      if (draftYear && draftMonth && draftDay) {
        onChange(`${draftYear}-${draftMonth}-${draftDay}`);
      }
    } else {
      let h = Number(draftHour);
      if (draftAP === "PM" && h !== 12) h += 12;
      if (draftAP === "AM" && h === 12) h = 0;
      onChange(`${pad(h)}:${draftMin || "00"}`);
    }
    setOpen(false);
  };

  const display =
    mode === "date" ? formatDateDisplay(value) : formatTimeDisplay(value);
  const Icon = mode === "date" ? CalendarIcon : ClockIcon;
  const ph = placeholder ?? (mode === "date" ? "Pick a date" : "Pick a time");
  const headerLabel =
    label ?? (mode === "date" ? "SELECT DATE" : "SELECT TIME");

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(true)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        !display && "text-muted-foreground",
        triggerClassName,
      )}
    >
      <span className="truncate">{display || ph}</span>
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
    </button>
  );

  const body = (
    <div className="space-y-4">
      {headerLabel && (
        <div className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          {headerLabel}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 bg-card/95 backdrop-blur-xl rounded-xl">
        {mode === "date" ? (
          <>
            <WheelPicker options={days} value={draftDay} onChange={setDraftDay} ariaLabel="Day" />
            <WheelPicker options={MONTHS} value={draftMonth} onChange={setDraftMonth} ariaLabel="Month" />
            <WheelPicker options={years} value={draftYear} onChange={setDraftYear} ariaLabel="Year" />
          </>
        ) : (
          <>
            <WheelPicker options={HOURS_12} value={draftHour} onChange={setDraftHour} ariaLabel="Hour" loop />
            <WheelPicker options={MINUTES} value={draftMin} onChange={setDraftMin} ariaLabel="Minute" loop />
            <WheelPicker options={AMPM} value={draftAP} onChange={(v) => setDraftAP(v as "AM" | "PM")} ariaLabel="AM/PM" />
          </>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="glass bg-card/95 backdrop-blur-xl rounded-t-2xl border-border/60 px-5 pt-6 pb-8 z-[10001]"
          >
            {body}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] glass bg-card/95 backdrop-blur-xl border-border/60 p-4"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
};

export default IOSDateTimePicker;
