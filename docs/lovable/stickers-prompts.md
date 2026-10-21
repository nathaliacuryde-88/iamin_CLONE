# Lovable prompts — replace UI emojis with the I am (IN) stickers

**Goal:** swap the emojis in the app's interface for our sticker set. **No feature changes.** Everything keeps working exactly as it does today; saved data is not touched.

How to use: paste the prompts into Lovable **one at a time, in order**. After each one, click through the screens in the checklist before sending the next. If something breaks, revert that step in Lovable's history and tell me what happened.

## Links Lovable should look at (pinned to one commit, so they never change)
- Sticker board (what each sticker means): https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/sticker-board-dark.jpg
- Mapping emoji → sticker → where it's used: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/README.md
- All PNG files (300×300, transparent): https://github.com/nathaliacuryde-88/iamin_CLONE/tree/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png
- Motion preview video: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/7a0cc6f2eb43e2bbbc71530d4f98e6eb3a21ac4a/marketing/brand/stickers/motion/stickers-motion-preview.mp4
- Direct download links (used in prompt 1): `https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/<name>.png`

---

## Prompt 1 — add the stickers to the project (no visible change)

```
I want to prepare a sticker set that will later replace emojis in the UI. In this step NOTHING visible changes and no existing file is edited except adding new files.

Look at this board to understand the stickers: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/sticker-board-dark.jpg
And this mapping: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/README.md

1) Download each of these PNG files into public/stickers/ keeping the exact file name:
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/ball.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/balloon.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/battery.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/bottle.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/brokenheart.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/burst.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/cake.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/calendar.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/cam.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/cash.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/cheers.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/clock.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/couch.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/croissant.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/crown.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/crystal.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/dice.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/disco.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/envelope.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/eyes.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/film.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/flame.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/free.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/ghost.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/gift.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/heart.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/hey.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/in.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/key.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/lock.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/maybe.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/meh.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/moon.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/palette.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/pin.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/pizza.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/plus1.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/popcorn.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/popper.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/radar.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/receipt.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/scooter.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/seal.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/skull.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/sneaker.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/spark.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/spritz.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/sun.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/tent.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/ticket.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/tote.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/vinyl.png
https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png/wave.png

2) Create src/lib/stickers.ts with exactly this:

export const STICKER_IDS = ["ball","balloon","battery","bottle","brokenheart","burst","cake","calendar","cam","cash","cheers","clock","couch","croissant","crown","crystal","dice","disco","envelope","eyes","film","flame","free","ghost","gift","heart","hey","in","key","lock","maybe","meh","moon","palette","pin","pizza","plus1","popcorn","popper","radar","receipt","scooter","seal","skull","sneaker","spark","spritz","sun","tent","ticket","tote","vinyl","wave"] as const;
export type StickerId = typeof STICKER_IDS[number];

// Display-only mapping. Saved values never change.
export const EMOJI_TO_STICKER: Record<string, StickerId> = {
  "🔥":"flame","👀":"eyes","💀":"skull","🥂":"cheers","🍻":"spritz","🍸":"spritz","🍹":"spritz","🍷":"spritz",
  "❤":"heart","💖":"heart","💜":"heart","🎉":"popper","🥳":"plus1","🎊":"plus1","👯":"plus1","😐":"meh",
  "⭐":"burst","🏅":"burst","🤔":"maybe","🤷":"maybe","✅":"in","✋":"in","🙌":"in","🙋":"in",
  "🎵":"vinyl","🎶":"vinyl","🎪":"tent","🎂":"cake","🍰":"cake","🎨":"palette","🍽":"pizza","🌮":"pizza","☕":"croissant",
  "🎬":"popcorn","⚡":"ball","⚽":"ball","👟":"ball","💃":"sneaker","🛍":"tote","🛋":"couch","☀":"sun","🌙":"moon","😴":"battery","🪩":"disco","🏠":"key",
  "📍":"pin","🧭":"pin","🛵":"scooter","🚶":"scooter","📡":"radar","🤝":"seal","👻":"ghost","🫥":"ghost","🎲":"dice","🎟":"ticket",
  "🧾":"receipt","💸":"cash","📸":"cam","🎞":"film","📼":"film","🔮":"crystal","🔒":"lock","🗓":"calendar","📅":"calendar",
  "🎈":"balloon","🎁":"gift","🍾":"bottle","💌":"envelope","✉":"envelope","📭":"envelope","👋":"hey","⏰":"clock",
  "✨":"spark","💫":"spark","🌟":"spark","👑":"crown","💔":"brokenheart","🌊":"wave","🌴":"wave",
};

// The "Your mood today" row uses its own meaning for a few emojis.
export const MOOD_STICKER: Record<string, StickerId> = {
  "🔥":"disco","🪩":"disco","🍻":"spritz","💃":"sneaker","🛋":"couch","👟":"ball","☀":"sun",
};

const clean = (e: string) => e.replace(/\uFE0F/g, "").trim();
export const stickerFor = (emoji?: string | null, context?: "mood"): StickerId | null => {
  if (!emoji) return null;
  const k = clean(emoji);
  if (context === "mood" && MOOD_STICKER[k]) return MOOD_STICKER[k];
  return EMOJI_TO_STICKER[k] ?? null;
};

3) Create src/components/Sticker.tsx:

import { stickerFor, type StickerId } from "@/lib/stickers";
// The PNG has transparent padding around the art, so the image is drawn 20% bigger
// with a negative margin: the visible sticker matches `size` and the layout box stays `size`.
export function Sticker({ id, size = 24, tilt = 0, label, className = "" }: { id: StickerId; size?: number; tilt?: number; label?: string; className?: string }) {
  const box = Math.round(size * 1.2), m = -Math.round(size * 0.1);
  return (
    <img src={`/stickers/${id}.png`} width={box} height={box} draggable={false}
      alt={label ?? ""} aria-hidden={label ? undefined : true}
      className={`inline-block select-none pointer-events-none align-middle ${className}`}
      style={{ width: box, height: box, margin: m, transform: tilt ? `rotate(${tilt}deg)` : undefined }} />
  );
}
// Renders the sticker for an emoji, or the emoji itself (unchanged) if there is no sticker for it.
export function EmojiSticker({ emoji, size = 24, context, tilt, label, className }: { emoji?: string | null; size?: number; context?: "mood"; tilt?: number; label?: string; className?: string }) {
  const id = stickerFor(emoji, context);
  if (!id) return <>{emoji}</>;
  return <Sticker id={id} size={size} tilt={tilt} label={label} className={className} />;
}

Do not use these components anywhere yet. Do not edit any existing file.
```

**Check:** the app looks exactly the same. `/stickers/in.png` opens in the browser.

---

## Prompt 2 — moods and avatar status

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

Use <EmojiSticker> from src/components/Sticker.tsx (mapping in src/lib/stickers.ts; board: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/sticker-board-dark.jpg).

1) "Your mood" / out tonight row and the mood picker sheet (OutTonightBar and the sheet that uses VIBES from useOutTonight): wherever a vibe emoji is RENDERED (on the avatar, in the picker options, in the friend's popup), render <EmojiSticker emoji={vibe} context="mood" size={the same px size the emoji has today} />. The VIBES array, the saved `vibe` value and the mutation stay exactly the same.
2) StatusBadge and StatusSheet: render the status as a sticker — available → <Sticker id="free" />, not_tonight → <Sticker id="moon" />, low_energy → <Sticker id="battery" />, same size as today's emoji. Keep the status keys and logic. In the helper text ("Friends see 🌙 on your avatar") replace the emoji with the matching inline <Sticker size={16} />.
```

**Check:** set and clear your mood; friends' moods still show; status sheet still saves.

---

## Prompt 3 — reactions, exit poll and scores

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

1) ReactionPicker: keep REACTION_EMOJIS and the saved reaction values exactly as they are. Only render each option and each shown reaction with <EmojiSticker emoji={e} size={same size} label={e} />.
2) Every place that displays saved reactions (counts on cards, capsule photos, comments): render with <EmojiSticker>.
3) ExitPollSheet: options stay {rating:"fire"|"mid"|"flop"}; show <Sticker id="flame" />, <Sticker id="meh" />, <Sticker id="skull" /> instead of 🔥 😐 💀. Same in EventScoreStrip, CapsuleDetail and the organizer Pulse/PastEventDetail score rows.
4) Score badges that use ★ ⭐ 🏅 as an icon (NightReceipt, CreatorScoreBadge): use <Sticker id="burst" /> next to the number. Keep the numbers and text.
```

**Check:** react to an event and a photo, remove the reaction, answer the exit poll, open a capsule and the night receipt.

---

## Prompt 4 — event categories

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

Event categories (FilterSheet, EventCard, AddEvent, EventDetail and anywhere a category chip shows an emoji): keep the category labels/values and the `emoji` fields in the code exactly as they are, and render the chip icon with <EmojiSticker emoji={category.emoji} size={same size} />. Expected result: music → vinyl, party → popper, festival → tent, birthday → cake, art → palette, food → pizza, brunch → croissant, cinema → popcorn, sports → ball, street markets → tote.
```

**Check:** filter by category, create an event with a category, open an event.

---

## Prompt 5 — on the night: radar, pacts, ghosts, roulette, the line, the tab

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

Render these emojis with <EmojiSticker> (same size): LiveRadarSection and LiveRadarMapSheet (📍 🛵 🛋️ 🎉 📡 🚶 — the map popup text can keep plain text), PactSection (🤝 🌙), EventPulseSection (✋ "I'm in" and 👻 "Let it fade"), GhostKnockSection and FriendGhostCard (👻), Roulette (🎲 📍), NightReceipt and expense rows (🧾 💸).
Line mode (useLineMode, LineModeAttendeeView, AttendeeLineCard): 🟢 🟡 🔴 ⛔ are status, not mood — render them as small round dots (8px) in green #17B75A, yellow #FFD400, red #F23D3D and grey, next to the same text. Do not change the line-mode states or logic.
```

**Check:** live radar statuses, make and break a pact, ghost knock, roulette, line mode as organizer and as guest, split the tab.

---

## Prompt 6 — capsule and birthdays

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

1) TimeCapsule, CapsuleDetail, RevealedPredictions: render 📸 🎞️ 🔮 🔒 📭 with <EmojiSticker> (same size).
2) BirthdayCardComposer and BirthdayCardReveal: keep EMOJI_OPTIONS and the saved card `emoji` exactly as they are. In the option picker and on the card, render each with <EmojiSticker emoji={e} size={same size} />. The confetti reveal stays as it is.
3) CoverStudio presets (Glow, Party, Chill, Disco, Birthday, Sunny): render the preset icon with <EmojiSticker>. Emoji layers that users add or type stay real emojis — do not change the layer system or the saved cover.
```

**Check:** seal a prediction, open a capsule, send and open a birthday card, make an event cover with each preset.

---

## Prompt 7 — notifications, empty states and toasts

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

1) NotificationsBell: the icon per notification type becomes a sticker (same size): invite 💌 → envelope, friend_request 👋 → hey, new_follower ✨ → spark, event_rsvp_accepted ✅ → in, payment_received 💸 → cash, expense_added 🧾 → receipt, payment_reminder ⏰ → clock, birthday_card 🎂 → cake, ghost_ignored 👻 → ghost, pact_sealed 🤝 → seal, line_walk_in 🟢 → ticket, duplicate_event 🔁 → calendar, default 🔔 → in. Keep the switch on notification type; only change what it returns (a <Sticker>).
2) Empty states and CTAs (EmptyFeedSuggestions, AddMoreEventsCTA, FollowMoreFriendsCTA, Welcome, Onboarding, KnowMore): render decorative emojis with <EmojiSticker>.
3) Toast titles and button labels that END with a decorative emoji (e.g. "Thanks for the vibe check ✨", "Send card 🎉", "Knock sent 👻", "Yes, I'm in ✅", "Are you really in? 👀"): remove the trailing emoji from the text VALUES in src/locales/en.json and de.json and in the components. Keep every translation key and the rest of the wording.
4) Organizer: SuperHostsCard 👑 → crown, SlippingAwayCard 💔 → brokenheart, CrowdDNACard icons via <EmojiSticker>.
```

**Check:** open notifications (all types if possible), the empty feed, onboarding, and trigger a couple of toasts.

---

## Prompt 8 — avatars without a photo (initials instead of emojis)

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

src/lib/avatarEmoji.tsx: keep getAvatarEmoji exactly as it is (other code may use it). Add a new function getAvatarMonogram(seed, name) that returns { initials, bg, fg }: initials = first letter of the first two words of the display name (or of the username, uppercase); bg picked deterministically from ["#D8FF3D","#FF5FA8","#3B6CFF","#FFE14D","#FF6A13"] with the same hash; fg = "#FFFFFF" for #3B6CFF, otherwise "#0B0B0A".
In the avatar fallback component(s) that currently show the emoji on a gradient, show the initials instead (font-weight 700, same circle size, flat bg colour, no gradient). Photos still show when there is one. Nothing else changes.
```

**Check:** a profile without a photo shows initials everywhere (feed, stories row, event attendees, notifications).

---

# Motion — making the stickers move where it makes sense

Send these after prompts 1–8 work. Preview of every animation (8 s video): https://github.com/nathaliacuryde-88/iamin_CLONE/blob/7a0cc6f2eb43e2bbbc71530d4f98e6eb3a21ac4a/marketing/brand/stickers/motion/stickers-motion-preview.mp4

**The idea:** stickers move only for a reason.
- **One-shots** play once, right after *your own* action: tap I'm in, react, vote, seal a pact, open the receipt. They last under 0.8 s.
- **Loops** run only while something is *live*: your mood tonight, "on the way", the live radar, a sealed prediction, an empty state. There are never more than 3 on screen at once, and never in the feed list, chips or the notification list.
- Everything turns off with the phone's "Reduce motion" setting.
- Only CSS animations: no new library and no new feature.

| Moment | Sticker | Motion |
|---|---|---|
| Tap I'm in / Maybe | in / maybe | slap onto the flyer corner |
| Set your mood | your mood sticker | slap; disco swings while you're out tonight |
| React | flame / eyes / cheers | slap |
| React ❤️ | heart | beat |
| React 🎉 / birthday reveal | popper | slap + confetti dots |
| Flop vote / 💀 | skull | shake |
| Night score appears | burst | spin in |
| Pact sealed | seal | stamp |
| Photo added to capsule | cam | flash |
| Morning-after receipt opens | receipt | prints in |
| Roulette result | dice | roll |
| I'm there (radar) | pin | drop |
| On the way (radar) | scooter | jitter loop while on the way |
| Live radar section | radar | slow spin while live |
| Sealed prediction (capsule still closed) | crystal | lime glow loop |
| Reminder / new unread notification | clock / its sticker | shake / slap once when the sheet opens |
| "Are you really in?" card | eyes | glance loop |
| Ghost card | ghost | float loop |
| Empty feed / empty states | spark / balloon | twinkle / float loop |
| Birthday today badge | balloon | float loop |
| Category chip selected | its sticker | slap |

## Prompt 9 — motion support in the Sticker component (no visible change yet)

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.

Look at this preview video to see the motions: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/7a0cc6f2eb43e2bbbc71530d4f98e6eb3a21ac4a/marketing/brand/stickers/motion/stickers-motion-preview.mp4

1) Create src/styles/stickers-motion.css with exactly the content of this file: https://raw.githubusercontent.com/nathaliacuryde-88/iamin_CLONE/7a0cc6f2eb43e2bbbc71530d4f98e6eb3a21ac4a/marketing/brand/stickers/motion/stickers-motion.css
   Import it once in src/main.tsx (after index.css).

2) Replace src/components/Sticker.tsx with this version. It keeps the same props as before (id, size, tilt, label, className) and only ADDS optional motion props, so every existing usage keeps working unchanged:

import { useEffect, useRef, useState } from "react";
import { stickerFor, type StickerId } from "@/lib/stickers";

export type StickerMotion =
  | "slap" | "stamp" | "beat" | "shake" | "roll" | "drop" | "print" | "flash" | "spinin" | "confetti"
  | "swing" | "flicker" | "float" | "spin" | "spinfast" | "twinkle" | "glow" | "jitter" | "breathe" | "glance" | "wiggle";
const LOOPS = new Set<StickerMotion>(["swing","flicker","float","spin","spinfast","twinkle","glow","jitter","breathe","glance","wiggle"]);

// What each sticker does when motion="auto"
export const DEFAULT_MOTION: Partial<Record<StickerId, StickerMotion>> = {
  in:"slap", maybe:"slap", free:"slap", spritz:"slap", sneaker:"slap", couch:"slap", ball:"slap", key:"slap", meh:"slap",
  flame:"slap", eyes:"slap", cheers:"slap", ticket:"slap", cash:"slap", film:"slap", calendar:"slap", envelope:"slap", hey:"slap",
  vinyl:"slap", tent:"slap", cake:"slap", palette:"slap", pizza:"slap", croissant:"slap", popcorn:"slap", tote:"slap", gift:"beat",
  heart:"beat", popper:"confetti", plus1:"spinin", burst:"spinin", crown:"spinin", skull:"shake", clock:"shake", lock:"shake",
  bottle:"shake", brokenheart:"shake", seal:"stamp", receipt:"print", cam:"flash", dice:"roll", pin:"drop",
  disco:"swing", scooter:"jitter", radar:"spin", crystal:"glow", ghost:"float", balloon:"float", wave:"float",
  spark:"twinkle", sun:"breathe", moon:"breathe", battery:"breathe",
};

type StickerProps = {
  id: StickerId; size?: number; tilt?: number; label?: string; className?: string;
  motion?: StickerMotion | "auto"; // which animation
  playKey?: unknown;               // one-shots replay every time this value changes (not on first render)
  playOnMount?: boolean;           // one-shot also plays on first render (use only for reveal screens)
  loop?: boolean;                  // loops run only while this is true (a live state)
};

export function Sticker({ id, size = 24, tilt = 0, label, className = "", motion, playKey, playOnMount = false, loop = false }: StickerProps) {
  const name = motion === "auto" ? DEFAULT_MOTION[id] : motion;
  const isLoop = !!name && LOOPS.has(name);
  const first = useRef(true);
  const [plays, setPlays] = useState(0);
  useEffect(() => { if (first.current) { first.current = false; return; } setPlays((n) => n + 1); }, [playKey]);
  const active = !!name && (isLoop ? loop : plays > 0 || playOnMount);
  const box = Math.round(size * 1.2), m = -Math.round(size * 0.1);
  return (
    <span key={plays} className={`stk ${active ? `stk-m-${name}` : ""} ${className}`}
      style={{ width: size, height: size, fontSize: size, rotate: tilt ? `${tilt}deg` : undefined }}
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <img src={`/stickers/${id}.png`} alt="" draggable={false} style={{ width: box, height: box, margin: m }} />
    </span>
  );
}

export function EmojiSticker({ emoji, context, ...rest }: Omit<StickerProps, "id"> & { emoji?: string | null; context?: "mood" }) {
  const id = stickerFor(emoji, context);
  if (!id) return <>{emoji}</>;
  return <Sticker id={id} {...rest} />;
}

Do not add motion to any screen yet. Check that every sticker still looks exactly as before.
```

**Check:** nothing on screen changes.

## Prompt 10 — turn the motion on at the right moments

```
RULES FOR THIS CHANGE — visual only, nothing else changes:
- Do not change any feature, logic, state, hook, database value, Supabase query/mutation/RPC, edge function, route, prop, translation key or test.
- Emoji values that are SAVED stay exactly as they are (out-tonight `vibe` like "🍻", reactions like "🔥", birthday card emoji, exit poll ratings, cover layers). Only how they are RENDERED changes, using <EmojiSticker>.
- If an emoji is not in EMOJI_TO_STICKER, render it exactly as today.
- Do not touch text people type (chat, notes, comments, captions, event names, the Cover Studio "type any emoji" input).
- Keep the same box size as the emoji being replaced, so no layout moves.
- Do not restyle anything else in this step (colours, fonts, spacing stay as they are).
- When done, list every file you changed.
MOTION RULES:
- Only use the Sticker/EmojiSticker props motion, playKey, playOnMount and loop. Use the existing state of each screen; the only new state allowed is a local UI counter or "last tapped" value used as playKey.
- One-shots play only after the current user's own tap (or the first time a reveal screen opens). Never on page load of lists, never because of realtime updates from other people.
- Loops only while the live state is true, at most 3 looping stickers visible at once. No motion in the feed card list, chips lists or the notification list except where listed below.
- Where a one-shot plays after a tap and that tap has no haptic yet, call the existing useHaptics() with "light" ("success" for I'm in and pact sealed). Don't add a second haptic where there already is one.
- The CSS already turns everything off with prefers-reduced-motion.

See https://github.com/nathaliacuryde-88/iamin_CLONE/blob/7a0cc6f2eb43e2bbbc71530d4f98e6eb3a21ac4a/marketing/brand/stickers/motion/stickers-motion-preview.mp4 for how each one looks.

1) RSVP (feed card and EventDetail): when the current user taps I'm in, a 44px <Sticker id="in" motion="slap" playKey={rsvpStatus} /> appears on the top-right corner of the flyer image (tilt 10) and stays while the status is "in". Same with id="maybe" for Maybe. No change to the buttons or RSVP logic.
2) Your mood (OutTonightBar): your own mood sticker uses motion="auto" playKey={myVibe}; if your vibe is 🔥/🪩 (disco) it also gets loop={true} while it is set. Friends' mood stickers: no motion.
3) Reactions (ReactionPicker and where your own reaction is shown): motion="auto" with playKey = the reaction you just tapped (local "last tapped"): heart beats, 🎉 confetti, 💀 shakes, others slap.
4) ExitPollSheet: the option you pick plays its motion once (flame slap, meh slap, skull shake). Night score burst (NightReceipt / EventScoreStrip): motion="spinin" playOnMount the first time the receipt opens.
5) Pact sealed (PactSection): seal motion="stamp" playKey={sealed}.
6) Capsule: photo added → cam motion="flash" playKey={photoCount} for the uploader only; morning-after receipt sheet header → receipt motion="print" playOnMount; sealed predictions while the capsule is still closed → crystal motion="glow" loop.
7) Roulette: dice motion="roll" playKey={result} when the result shows (after the existing spin).
8) Live radar: your "I'm there" → pin motion="drop" playKey={myStatus}; your "On the way" chip → scooter motion="jitter" loop while that is your status; the radar title sticker → motion="spin" loop while the radar section is live.
9) Birthday: BirthdayCardReveal → cake slap then popper confetti (playOnMount; keep the existing confetti); "birthday today" badge balloon → float loop.
10) Small touches: RealityCheckCard eyes → glance loop; FriendGhostCard ghost → float loop; empty feed / empty states → one spark (twinkle) or balloon (float) loop; FilterSheet → the category sticker you just selected plays slap; NotificationsBell → when the sheet opens, the stickers of the first 3 UNREAD items play once (playOnMount), the rest stay still.
List every file you changed.
```

**Check:** tap I'm in / Maybe, set a mood, react, vote in the exit poll, seal a pact, add a capsule photo, open the receipt, spin the roulette, use the radar, open a birthday card. Then turn on iPhone Settings → Accessibility → Motion → Reduce Motion and check that the stickers stay still.

---

## Not part of this round
- The new colours, fonts and layouts (direction B, dark + light) — a separate set of prompts later.
- Seasonal demo page and anything people type themselves keep their emojis.
