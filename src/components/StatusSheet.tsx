import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMyStatus, useSetStatus, type UserStatus } from "@/hooks/useUserStatus";
import { STATUS_EMOJI, STATUS_LABEL } from "@/components/StatusBadge";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toFriendlyError } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORDER: UserStatus[] = ["available", "not_tonight", "low_energy"];

const DESC: Record<UserStatus, string> = {
  available: "Default. No badge shown.",
  not_tonight: "Auto-clears in 24h. Friends see 🌙 on your avatar.",
  low_energy: "Stays for a week. Friends see 😴 on your avatar.",
};

export default function StatusSheet({ open, onOpenChange }: Props) {
  const { data: current } = useMyStatus();
  const set = useSetStatus();
  const { toast } = useToast();

  const choose = async (s: UserStatus | null) => {
    try {
      await set.mutateAsync(s);
      onOpenChange(false);
    } catch (e) {
      const f = toFriendlyError(e, "Update status");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>How are you feeling?</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1.5">
          {ORDER.map((s) => {
            const active = current?.status === s || (!current && s === "available");
            return (
              <button
                key={s}
                onClick={() => choose(s === "available" ? null : s)}
                disabled={set.isPending}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  active ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary/40 hover:bg-secondary/60"
                }`}
              >
                <span className="text-2xl">{STATUS_EMOJI[s]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{STATUS_LABEL[s]}</p>
                  <p className="text-[11px] text-muted-foreground">{DESC[s]}</p>
                </div>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
          {current && (
            <button
              onClick={() => choose(null)}
              disabled={set.isPending}
              className="w-full p-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors flex items-center justify-center gap-2"
            >
              {set.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Clear status
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          Travelling? Block those days on your calendar instead — friends will see them as unavailable.
        </p>
      </SheetContent>
    </Sheet>
  );
}
