import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";
import { useOrganizerDNA } from "@/hooks/useOrganizerDNA";

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="tactile-widget p-4">
    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-3">
      {title}
    </p>
    {children}
  </div>
);

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="p-3 rounded-xl bg-foreground/[0.04] dark:bg-white/5 text-center">
    <p className="text-xl font-bold leading-none">{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">{label}</p>
  </div>
);

const EmptyState = () => (
  <p className="text-xs text-muted-foreground text-center py-6">
    Run your first event to start building your venue DNA.
  </p>
);

interface Props {
  organizerUserId: string;
}

const OrganizerDNACard = ({ organizerUserId }: Props) => {
  const { dna, isLoading } = useOrganizerDNA(organizerUserId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-1.5 py-1">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
          Your venue DNA
        </p>
      </div>

      {!dna.hasEnoughData ? (
        <SectionCard title="Coming soon">
          <EmptyState />
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Track record">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={dna.totals.events} label="events run" />
              <Stat value={dna.totals.attendees} label="total attendees" />
              <Stat
                value={dna.totals.avgRating != null ? dna.totals.avgRating.toFixed(1) : "—"}
                label="avg rating"
              />
              <Stat value={dna.totals.polls} label="exit polls" />
            </div>
          </SectionCard>

          <SectionCard title="Signature vibe">
            {!dna.signature.topVibe && !dna.signature.bestDay ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Need a few rated events to surface your signature.
              </p>
            ) : (
              <div className="space-y-3">
                {dna.signature.topVibe && (
                  <div className="p-3 rounded-xl bg-foreground/[0.04] dark:bg-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Top-rated vibe
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {dna.signature.topVibe.vibe}
                      <span className="text-muted-foreground text-sm font-normal">
                        {" "}
                        · {dna.signature.topVibe.avg.toFixed(1)}/5
                      </span>
                    </p>
                  </div>
                )}
                {dna.signature.bestDay && (
                  <div className="p-3 rounded-xl bg-foreground/[0.04] dark:bg-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Best-performing day
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {dna.signature.bestDay.day}
                      <span className="text-muted-foreground text-sm font-normal">
                        {" "}
                        · {dna.signature.bestDay.avg.toFixed(1)}/5
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default OrganizerDNACard;
