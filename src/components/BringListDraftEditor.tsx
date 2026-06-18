import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  vibe?: string;
}

const SUGGESTIONS_BY_VIBE: Record<string, string[]> = {
  picnic: ["Blanket", "Snacks", "Drinks", "Cups", "Frisbee", "Sunscreen"],
  party: ["Speaker", "Drinks", "Cups", "Ice", "Snacks"],
  beach: ["Towel", "Sunscreen", "Speaker", "Cooler", "Drinks", "Ball"],
  default: ["Speaker", "Drinks", "Snacks", "Cups", "Ice"],
};

const getSuggestions = (vibe?: string) => {
  if (!vibe) return SUGGESTIONS_BY_VIBE.default;
  const k = vibe.toLowerCase();
  for (const [key, val] of Object.entries(SUGGESTIONS_BY_VIBE)) {
    if (k.includes(key)) return val;
  }
  return SUGGESTIONS_BY_VIBE.default;
};

const BringListDraftEditor = ({ items, onChange, vibe }: Props) => {
  const [draft, setDraft] = useState("");

  const add = (label: string) => {
    const v = label.trim();
    if (!v) return;
    if (items.some((i) => i.toLowerCase() === v.toLowerCase())) return;
    onChange([...items, v]);
    setDraft("");
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const suggestions = getSuggestions(vibe).filter(
    (s) => !items.some((i) => i.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-2 pt-1 border-t border-border/60">
      <p className="text-[10px] text-muted-foreground">
        Pre-fill items now (optional). Attendees can add more later.
      </p>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-accent/15 text-accent rounded-full pl-2.5 pr-1 py-0.5 text-xs"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(i)}
                className="h-4 w-4 rounded-full hover:bg-accent/20 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-[11px] px-2 py-0.5 rounded-full bg-secondary hover:bg-primary/20 transition-colors border border-border"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Add an item..."
          className="flex-1 h-9 text-sm"
          maxLength={60}
        />
        <Button
          type="button"
          size="icon"
          className="h-9 w-9"
          disabled={!draft.trim()}
          onClick={() => add(draft)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BringListDraftEditor;
