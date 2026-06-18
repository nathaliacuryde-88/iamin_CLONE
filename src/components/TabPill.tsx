import { Wallet } from "lucide-react";
import { formatCents } from "@/hooks/useEventTab";

interface TabPillProps {
  totalCents: number;
  currency?: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
}

const TabPill = ({ totalCents, currency = "EUR", onClick, size = "sm" }: TabPillProps) => {
  if (totalCents <= 0) return null;
  const isSm = size === "sm";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors ${
        isSm ? "px-2.5 py-1 text-[11px] font-semibold" : "px-3 py-1.5 text-xs font-semibold"
      }`}
      title="Group tab"
    >
      <Wallet className={isSm ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>Tab · {formatCents(totalCents, currency)}</span>
    </button>
  );
};

export default TabPill;
