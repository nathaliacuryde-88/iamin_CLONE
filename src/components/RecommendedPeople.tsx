import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, UserPlus2 } from "lucide-react";
import { useRecommendedPeople } from "@/hooks/useRecommendedPeople";
import { emojiFallbackProps } from "@/lib/avatarEmoji";

interface Props {
  followingIds: Set<string> | undefined;
  onToggleFollow: (userId: string) => void;
}

/**
 * Horizontal carousel of suggested people — avatar, name, mutuals, follow
 * button. Snap-scroll on mobile.
 */
const RecommendedPeople = ({ followingIds, onToggleFollow }: Props) => {
  const { data: people, isLoading } = useRecommendedPeople(20);
  if (isLoading) return null;
  if (!people || people.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
          <UserPlus2 className="h-3.5 w-3.5" /> People you may know
        </h3>
      </div>

      <div
        className="-mr-5 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pr-5"
        style={{ scrollbarWidth: "none" }}
      >
        {people.map((p) => {
          const following = followingIds?.has(p.user_id) ?? false;
          return (
            <div
              key={p.user_id}
              className="snap-start shrink-0 w-[160px] rounded-2xl card-surface dark:bg-white/[0.04] dark:border-white/10 p-4 flex flex-col items-center text-center"
            >
              <Link to={`/profile/${p.user_id}`} className="flex flex-col items-center">
                <Avatar className="h-16 w-16 mb-3">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback {...emojiFallbackProps(p.display_name ?? p.user_id)} />
                </Avatar>
                <p className="text-sm font-semibold text-foreground truncate max-w-full">
                  {p.display_name ?? "User"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-full mt-0.5">
                  {p.mutuals > 0
                    ? `${p.mutuals} mutual${p.mutuals === 1 ? "" : "s"}`
                    : p.sameCity && p.city
                      ? `📍 ${p.city}`
                      : p.isNew
                        ? "new here"
                        : "\u00A0"}
                </p>
              </Link>
              <Button
                size="sm"
                variant={following ? "outline" : "default"}
                className={`mt-3 w-full rounded-full ${following ? "" : "glow-sm"}`}
                onClick={() => onToggleFollow(p.user_id)}
              >
                {following ? (
                  <><UserMinus className="h-3.5 w-3.5 mr-1" /> Following</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedPeople;
