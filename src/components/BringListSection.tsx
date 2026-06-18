import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package, Plus, X, Check } from "lucide-react";
import {
  useBringItems,
  useAddBringItem,
  useToggleClaim,
  useDeleteBringItem,
} from "@/hooks/useBringItems";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";

interface AttendeeProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface BringListSectionProps {
  eventId: string;
  isOwner: boolean;
  attendees: AttendeeProfile[];
  vibeCategory?: string | null;
}

const SUGGESTIONS_BY_VIBE: Record<string, string[]> = {
  picnic: ["Blanket", "Snacks", "Drinks", "Cups", "Frisbee", "Sunscreen"],
  party: ["Speaker", "Drinks", "Cups", "Ice", "Snacks"],
  beach: ["Towel", "Sunscreen", "Speaker", "Cooler", "Drinks", "Ball"],
  default: ["Speaker", "Drinks", "Snacks", "Cups", "Ice"],
};

const getSuggestions = (vibe?: string | null) => {
  if (!vibe) return SUGGESTIONS_BY_VIBE.default;
  const key = vibe.toLowerCase();
  for (const [k, v] of Object.entries(SUGGESTIONS_BY_VIBE)) {
    if (key.includes(k)) return v;
  }
  return SUGGESTIONS_BY_VIBE.default;
};

const BringListSection = ({
  eventId,
  isOwner,
  attendees,
  vibeCategory,
}: BringListSectionProps) => {
  const { user } = useAuth();
  const haptic = useHaptics();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useBringItems(eventId);
  const addItem = useAddBringItem();
  const toggleClaim = useToggleClaim();
  const deleteItem = useDeleteBringItem();
  const [newLabel, setNewLabel] = useState("");

  const profileFor = (uid: string | null) =>
    uid ? attendees.find((a) => a.user_id === uid) : undefined;

  const handleAdd = async (label: string) => {
    if (!label.trim()) return;
    haptic("light");
    try {
      await addItem.mutateAsync({ eventId, label });
      setNewLabel("");
    } catch (e: any) {
      toast({ title: "Couldn't add", description: e.message, variant: "destructive" });
    }
  };

  const handleClaim = (itemId: string, mine: boolean) => {
    haptic(mine ? "selection" : "success");
    toggleClaim.mutate({ itemId, eventId, claim: !mine });
  };

  const handleDelete = (itemId: string) => {
    haptic("warning");
    deleteItem.mutate({ itemId, eventId });
  };

  if (isLoading) return null;

  const suggestions = getSuggestions(vibeCategory).filter(
    (s) => !items.some((i) => i.label.toLowerCase() === s.toLowerCase())
  );

  return (
    <Card className="tactile-widget">
      <CardHeader className="pb-3">
        <CardTitle className="tactile-title flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          Bring what?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No items yet. Add what you'd like people to bring 👇
          </p>
        )}

        <div className="space-y-1.5">
          {items.map((item) => {
            const claimers = item.claims
              .map((c) => ({ claim: c, profile: profileFor(c.user_id) }))
              .filter((x) => x.profile);
            const mine = item.claims.some((c) => c.user_id === user?.id);
            const claimed = item.claims.length > 0;
            const canDelete = user?.id === item.created_by || isOwner;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors"
              >
                <button
                  onClick={() => handleClaim(item.id, mine)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      mine
                        ? "bg-accent text-accent-foreground"
                        : claimed
                        ? "bg-accent/20 text-accent"
                        : "border border-border"
                    }`}
                  >
                    {(mine || claimed) && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={`text-sm truncate ${claimed ? "" : "font-medium"}`}
                  >
                    {item.label}
                  </span>
                  {claimers.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <div className="flex -space-x-1.5">
                        {claimers.slice(0, 3).map(({ claim, profile }) => (
                          <Avatar
                            key={claim.id}
                            className="h-5 w-5 ring-1 ring-background"
                          >
                            <AvatarImage src={profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                              {profile?.display_name?.[0] ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {mine && claimers.length === 1
                          ? "You"
                          : mine
                          ? `You +${claimers.length - 1}`
                          : claimers.length === 1
                          ? claimers[0].profile?.display_name ?? "Someone"
                          : `${claimers.length} bringing`}
                      </span>
                    </div>
                  )}
                </button>
                {canDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => handleAdd(s)}
                className="text-xs px-2.5 py-1 rounded-full glass hover:bg-secondary/60 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(newLabel);
          }}
          className="flex gap-2 pt-1"
        >
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add an item..."
            className="flex-1"
            maxLength={60}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newLabel.trim() || addItem.isPending}
            className="glow-sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BringListSection;
