import { Link } from "react-router-dom";
import { Compass, UserPlus, Sparkles } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const EmptyFeedSuggestions = () => {
  const haptic = useHaptics();
  const { toast } = useToast();
  const { user } = useAuth();

  const inviteShare = async () => {
    haptic("light");
    const url = user ? `${window.location.origin}/profile/${user.id}` : window.location.origin;
    const text = "Come hang on I am in — track our plans, save events, see who's in. ✨";
    try {
      if (navigator.share) {
        await navigator.share({ title: "I am in", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: "Link copied!" });
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="space-y-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 text-6xl leading-none origin-center" aria-hidden="true">
          <span role="img" aria-label="Eyes" className="animate-eyes-peek inline-block">👀</span>
        </div>
        <p className="text-foreground text-base font-semibold">Your feed is quiet</p>
        <p className="text-muted-foreground/80 text-sm mt-1 max-w-xs mx-auto">
          Add events from screenshots or links — and bring some friends so they show up here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-w-md mx-auto">
        {/* Featured: follow the creator so brand-new users see a real face in their feed */}
        <Link
          to="/discover?q=NathCury"
          onClick={() => haptic("light")}
          className="flex items-center gap-3 p-4 rounded-2xl card-surface border-primary/40 hover:border-primary/60 transition-colors glow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold">Follow the creator</p>
            <p className="text-[11px] text-muted-foreground truncate">
              Start with <span className="text-foreground/80">NathCury / Nath</span>
            </p>
          </div>
        </Link>

        <Link
          to="/discover"
          onClick={() => haptic("light")}
          className="flex items-center gap-3 p-4 rounded-2xl card-surface hover:border-primary/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold">Discover people</p>
            <p className="text-[11px] text-muted-foreground">Find friends already on I am in</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={inviteShare}
          className="flex items-center gap-3 p-4 rounded-2xl card-surface hover:border-primary/40 transition-colors text-left"
        >
          <div className="h-10 w-10 rounded-xl bg-accent/15 text-primary flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Invite a friend</p>
            <p className="text-[11px] text-muted-foreground">Share your profile link</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default EmptyFeedSuggestions;
