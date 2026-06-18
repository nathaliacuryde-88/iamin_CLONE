import { Link } from "react-router-dom";
import { Flame, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCityPulse } from "@/hooks/useCityPulse";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { emojiFallbackProps } from "@/lib/avatarEmoji";

/**
 * City Pulse — horizontal scroll strip of trending events nearby.
 * Lives at the top of Discover. Hidden when no events.
 */
const CityPulseStrip = () => {
  const { data: events, isLoading } = useCityPulse();

  if (isLoading || !events || events.length === 0) return null;

  return (
    <div className="space-y-2 -mx-4 px-4">
      <div className="flex items-center gap-1.5">
        <Flame className="h-3.5 w-3.5 text-accent" />
        <h3 className="text-xs uppercase tracking-wider font-semibold text-foreground">
          City Pulse
        </h3>
        <span className="text-[10px] text-muted-foreground">trending near you</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {events.map((e) => {
          const shown = e.going_profiles ?? [];
          const extra = Math.max(0, (e.going_count ?? 0) - shown.length);
          return (
            <Link
              key={e.id}
              to={`/event/${e.id}`}
              state={{ from: "city-pulse" }}
              className="snap-start shrink-0 w-[180px] rounded-xl glass overflow-hidden hover:glow-sm transition-all"
            >
              <div className="relative h-[110px] w-full bg-secondary/40">
                {e.image_url ? (
                  <img
                    src={e.image_url}
                    alt={e.name}
                    className="w-full h-full object-cover border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">
                    ✦
                  </div>
                )}
                {e.going_count > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur text-[10px] font-semibold">
                    <TrendingUp className="h-2.5 w-2.5 text-accent" />
                    {e.going_count}
                  </div>
                )}
                {shown.length > 0 && (
                  <div className="absolute bottom-2 left-2 flex items-center">
                    {shown.slice(0, 3).map((p, i) => (
                      <Avatar
                        key={p.user_id}
                        className={`h-6 w-6 ring-2 ring-background ${i > 0 ? "-ml-2" : ""}`}
                      >
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]" {...emojiFallbackProps(p.user_id ?? p.display_name)} />

                      </Avatar>
                    ))}
                    {extra > 0 && (
                      <span className="-ml-2 h-6 min-w-6 px-1 rounded-full bg-background/80 backdrop-blur ring-2 ring-background flex items-center justify-center text-[9px] font-semibold">
                        +{extra}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="p-2.5 space-y-0.5">
                <p className="text-xs font-semibold truncate">{e.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {e.date ? format(parseISO(e.date), "EEE, MMM d") : "TBD"}
                  {e.city && ` · ${e.city}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CityPulseStrip;
