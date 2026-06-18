import { useFriendStatuses } from "@/hooks/useFriendStatuses";
import type { UserStatus } from "@/hooks/useUserStatus";

export const STATUS_EMOJI: Record<UserStatus, string> = {
  available: "🟢",
  not_tonight: "🌙",
  low_energy: "😴",
};

export const STATUS_LABEL: Record<UserStatus, string> = {
  available: "Up for anything",
  not_tonight: "Not tonight",
  low_energy: "Low energy week",
};

interface Props {
  userId: string;
  size?: "sm" | "md";
}

/**
 * Small emoji chip overlaid on a friend's avatar to signal their current
 * social status. Renders nothing for "available" or unknown users.
 */
export default function StatusBadge({ userId, size = "sm" }: Props) {
  const { data: map } = useFriendStatuses([userId]);
  const s = map?.[userId];
  if (!s || s.status === "available") return null;
  const cls =
    size === "sm"
      ? "text-lg leading-none"
      : "text-xl leading-none";
  return (
    <span
      title={STATUS_LABEL[s.status]}
      aria-label={STATUS_LABEL[s.status]}
      className={`absolute -bottom-1.5 -right-1.5 z-10 inline-flex items-center justify-center rounded-full bg-background/90 ring-2 ring-background shadow-md ${size === "sm" ? "h-5 w-5" : "h-6 w-6"} ${cls}`}
    >
      {STATUS_EMOJI[s.status]}
    </span>
  );
}
