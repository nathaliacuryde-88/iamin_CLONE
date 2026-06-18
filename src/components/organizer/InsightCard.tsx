import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Sparkles } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

const InsightCard = ({ insights }: { insights: string[] }) => {
  const haptic = useHaptics();
  const [i, setI] = useState(0);
  const safe = insights.length > 0 ? insights : ["Run a few events to unlock insights about your audience."];
  const current = safe[i % safe.length];
  return (
    <Card className="bg-primary/10 border-primary/20">
      <CardContent className="p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm flex-1 leading-snug">{current}</p>
        <button
          type="button"
          onClick={() => { haptic("light"); setI((x) => x + 1); }}
          className="h-8 w-8 rounded-full bg-background/60 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Next insight"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
