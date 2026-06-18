import { AlertTriangle } from "lucide-react";

const ConflictBadge = ({ withEventName }: { withEventName: string }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-semibold">
    <AlertTriangle className="h-3 w-3" />
    Conflicts with your {withEventName}
  </span>
);

export default ConflictBadge;
