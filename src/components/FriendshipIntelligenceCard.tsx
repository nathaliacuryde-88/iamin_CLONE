import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarFallbackProps } from "@/lib/avatarColor";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useFriendshipIntelligence } from "@/hooks/useFriendshipIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function formatCents(cents: number, currency = "EUR") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

const EmptyState = () => (
  <p className="text-xs text-muted-foreground text-center py-6">
    Come back after a few events — this gets more interesting over time.
  </p>
);

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

const FriendshipIntelligenceCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useFriendshipIntelligence();

  const { data: profileToggle } = useQuery({
    queryKey: ["dna-badge-toggle", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_preferences" as any)
        .select("show_dna_badge")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data as any)?.show_dna_badge ?? false;
    },
  });

  const toggleBadge = async (next: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_preferences" as any)
      .upsert({ user_id: user.id, show_dna_badge: next } as any, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["dna-badge-toggle", user.id] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast({ title: next ? "Badge will show on your profile" : "Badge hidden" });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }
  if (!data) return null;

  const a = data.archetype;

  return (
    <div className="space-y-3">
      {/* Privacy strip */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
          Your going-out DNA
        </p>
      </div>

      {!data.hasEnoughData ? (
        <SectionCard title="Coming soon">
          <EmptyState />
        </SectionCard>
      ) : (
        <>
          {/* Section 1 — Archetype */}
          <SectionCard title="Your archetype">
            <div className="text-center py-2">
              <div className="text-5xl mb-2">{a.emoji}</div>
              <p className="text-lg font-bold">{a.label}</p>
              <p className="text-sm text-muted-foreground mt-1 px-4">{a.description}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-3 italic">
                Updates as your habits change
              </p>
            </div>
          </SectionCard>

          {/* Section 2 — Your people */}
          <SectionCard title="Who you actually go out with">
            {data.topFriends.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {data.topFriends.map((f) => (
                  <Link
                    key={f.user_id}
                    to={`/profile/${f.user_id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/[0.04] dark:hover:bg-white/5 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={f.avatar_url ?? undefined} />
                      <AvatarFallback {...avatarFallbackProps(f.display_name ?? f.user_id)}>{f.display_name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          {f.display_name ?? "Friend"}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {f.shared} shared
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{f.line}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Section 3 — Your year */}
          <SectionCard title={`${new Date().getFullYear()} so far`}>
            <div className="grid grid-cols-2 gap-3">
              <Stat value={data.year.attended} label="attended" />
              <Stat value={data.year.organised} label="organised" />
              <Stat value={formatCents(data.year.spentCents)} label="owed to you" />
              <Stat value={formatCents(data.year.owedCents)} label="you owe" />
              <Stat value={data.year.cities} label="cities" />
              <Stat value={data.year.streak} label="current streak" />
            </div>
            {data.year.topNight && (
              <div className="mt-3 p-3 rounded-xl bg-foreground/[0.04] dark:bg-white/5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Highest rated night
                </p>
                <p className="text-sm font-semibold mt-1">
                  {data.year.topNight.rating} {data.year.topNight.name}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Section 4 — Receipts */}
          <SectionCard title="The receipts 🧾">
            {data.receipts.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="space-y-2">
                {data.receipts.map((r, i) => (
                  <li key={i} className="text-sm text-foreground/90 leading-relaxed">
                    — {r}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Section 5 — Honesty */}
          <SectionCard title="Your follow-through">
            {data.honesty.confirmed === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="text-4xl font-bold tracking-tight">{data.honesty.pct}%</p>
                  <p className="text-sm text-muted-foreground mt-1">{data.honesty.label}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-2">
                    {data.honesty.showedUp} of {data.honesty.confirmed} confirmed RSVPs
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-foreground/[0.04] dark:bg-white/5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Show this on my public profile</p>
                    <p className="text-[11px] text-muted-foreground">
                      Friends see your archetype badge.
                    </p>
                  </div>
                  <Switch
                    checked={!!profileToggle}
                    onCheckedChange={toggleBadge}
                  />
                </div>
              </>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default FriendshipIntelligenceCard;
