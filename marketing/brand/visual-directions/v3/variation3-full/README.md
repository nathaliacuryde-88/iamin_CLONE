# Variation 3 — main screens, dark + light

Space Grotesk for text, Anton for big headings, JetBrains Mono for dates/times/small labels, purple #7C3BED.
Logo unchanged (`src/components/Logo.tsx`: "I am (IN)", Space Grotesk, only the parentheses purple).
Icons are the app's own Lucide icons (`lucide-react`, same names as in the code), dumped with `lucide-dump.mjs`.
Emojis in the UI are replaced by the sticker set (`marketing/brand/stickers`).

Every screen keeps the features found in the 13 Oct build:
- Feed: People · Search · Bell (badge) · Settings; Inner Circle / City Pulse; Dices (roulette) and filter (with count);
  Today strip (Your mood + friends' vibe/where tags, wave); 3D card deck; visibility badge, location chip, reactions,
  avatars + count, Maybe / I'm in; bottom nav Feed · Calendar · Add · Capsule · Profile.
- Add: Photo / URL / Manual; cover (stickers or photo, Cover Studio); basics; when & where; vibe; description with
  Generate / Improve; Public / Circle / List / Ghost with explanation; invite friends; co-host; bring list; your RSVP; Create.
- Calendar: M / W / D, month navigation, sync, event dots by count, today, friend birthdays, unavailable days,
  long-press hint, Show Maybes, list with going/maybe dot, time, count, birthday card CTA, hidden (ghost) and past events.
- Capsule: one card per night with photo collage, +N, video badge, Add more, empty 48h dropzone with delete,
  photos · predictions count, Open.
- Profile: avatar + edit, events / followers / following, share link, creator score, @handle, city, birthday, bio,
  status, highlights, Rate past events, Events / DNA tabs, grouped event list with sort.

Source: `v3full.html` (needs `../../../../../` scratch assets `a/` and `stickers/stickers.js` next to it to re-render).
