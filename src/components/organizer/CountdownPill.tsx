import { differenceInCalendarDays, parseISO } from "date-fns";

const CountdownPill = ({ date }: { date: string | null | undefined }) => {
  if (!date) return null;
  const days = differenceInCalendarDays(parseISO(date), new Date());
  let label = "";
  if (days < 0) label = `${Math.abs(days)} days ago`;
  else if (days === 0) label = "Today";
  else if (days === 1) label = "Tomorrow";
  else label = `${days} days away`;
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide">
      {label}
    </span>
  );
};

export default CountdownPill;
