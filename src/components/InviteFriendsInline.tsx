import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFriendIds } from "@/hooks/useFriendIds";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Check, Loader2 } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

type Friend = { user_id: string; display_name: string | null; avatar_url: string | null };

interface Props {
  /** Currently selected user IDs. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Override label (default: "Invite friends"). */
  label?: string;
  /** Override empty-state copy. */
  emptyText?: string;
  /** Icon override — defaults to UserPlus. */
  icon?: React.ComponentType<{ className?: string }>;
  /** When true, hide the friends list entirely — only show the search field
   *  and selected chips. Used for co-host where we don't want a list dump. */
  searchOnly?: boolean;
}

/**
 * Inline friend picker used during private/ghost event creation. Lets the
 * creator pre-select people who will be invited as soon as the event is saved.
 * Also reused for the co-creator picker (different label + icon).
 */
const InviteFriendsInline = ({ value, onChange, label = "Invite friends", emptyText, icon: Icon = UserPlus, searchOnly = false }: Props) => {
  const { data: friendIds = [] } = useFriendIds();
  const haptic = useHaptics();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (friendIds.length === 0) { setFriends([]); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", friendIds);
      if (!cancelled) {
        setFriends((data as Friend[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [friendIds.join(",")]);

  const toggle = (id: string) => {
    haptic("selection");
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  const filtered = friends.filter(
    (f) => !search.trim() || (f.display_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const visibleIds = filtered.map((f) => f.user_id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => value.includes(id));
  const toggleAll = () => {
    haptic("selection");
    if (allSelected) {
      onChange(value.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = new Set([...value, ...visibleIds]);
      onChange([...merged]);
    }
  };

  // searchOnly mode: just a search field + selected chips, no list
  if (searchOnly) {
    const matches = friends.filter(
      (f) =>
        search.trim() &&
        !value.includes(f.user_id) &&
        (f.display_name ?? "").toLowerCase().includes(search.toLowerCase()),
    ).slice(0, 5);
    const selectedFriends = friends.filter((f) => value.includes(f.user_id));
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends to add as co-host"
            className="pl-9 h-10 text-sm"
          />
        </div>
        {selectedFriends.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedFriends.map((f) => (
              <button
                key={f.user_id}
                type="button"
                onClick={() => toggle(f.user_id)}
                className="flex items-center gap-1.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold pl-1 pr-2 py-0.5 ring-1 ring-primary/30"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={f.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[8px]">{f.display_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                {f.display_name ?? "User"}
                <span className="opacity-70">×</span>
              </button>
            ))}
          </div>
        )}
        {search.trim() && matches.length > 0 && (
          <div className="rounded-xl border border-border bg-card/50 divide-y divide-border overflow-hidden">
            {matches.map((f) => (
              <button
                key={f.user_id}
                type="button"
                onClick={() => { toggle(f.user_id); setSearch(""); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/60 text-left"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={f.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">{f.display_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate">{f.display_name ?? "User"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-secondary/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <div className="flex items-center gap-3">
          {friends.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          )}
          <span className="text-[11px] text-primary font-bold">{value.length} selected</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search friends"
          className="pl-9 h-9 text-sm"
        />
      </div>
      <div className="max-h-56 overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-4">
            {emptyText ?? "No friends yet — add some first to invite them."}
          </p>

        ) : filtered.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-4">No matches</p>
        ) : (
          filtered.map((f) => {
            const selected = value.includes(f.user_id);
            return (
              <button
                key={f.user_id}
                type="button"
                onClick={() => toggle(f.user_id)}
                className={`w-full flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors ${
                  selected ? "bg-primary/15" : "hover:bg-secondary/80"
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">{f.display_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium text-foreground truncate text-left">
                  {f.display_name ?? "User"}
                </span>
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${
                    selected ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InviteFriendsInline;
