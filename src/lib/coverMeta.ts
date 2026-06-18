// Shared parser for event cover meta (emoji + HSL background color).
// Supports both the legacy `[[cover:EMOJI|COLOR]]` and the current
// `[[nEMOJI|COLOR]]` markers embedded in description, as well as
// dedicated `cover_emoji` / `cover_color` columns when present.
export interface CoverMeta {
  emoji: string;
  color: string;
}

export const parseCoverMeta = (event: {
  cover_emoji?: string | null;
  cover_color?: string | null;
  description?: string | null;
}): CoverMeta | null => {
  if (event.cover_emoji && event.cover_color) {
    return { emoji: event.cover_emoji, color: event.cover_color };
  }
  const d = event.description ?? "";
  const m = d.match(/\[\[(?:cover:|n)([^|]+)\|([^\]]+)\]\]/);
  return m ? { emoji: m[1], color: m[2] } : null;
};
