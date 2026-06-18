---
name: Cover meta encoding
description: How emoji+color event covers are stored and rendered (no schema change)
type: feature
---
Emoji covers are encoded as a prefix tag in `events.description`:
`[[cover:EMOJI|H S% L%]] rest of description`

- AddEvent writes this when coverMode === "emoji" and image_url is null.
- EventCard parses it via `parseCoverMeta()` and `stripMeta()` and renders a colored block with the emoji centered when no image_url is present.
- Color values come from the `COVER_COLORS` palette in `EmojiCoverPicker.tsx` (HSL triplets).
