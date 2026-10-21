# Lovable prompts — replace UI emojis with the I am (IN) stickers

**Goal:** swap the emojis in the app's interface for our sticker set. **No feature changes.** Everything keeps working exactly as it does today; saved data is not touched.

How to use: paste the prompts into Lovable **one at a time, in order**. After each one, click through the screens in the checklist before sending the next. If something breaks, revert that step in Lovable's history and tell me what happened.

## Links Lovable should look at (pinned to one commit, so they never change)
- Sticker board (what each sticker means): https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/sticker-board-dark.jpg
- Mapping emoji → sticker → where it's used: https://github.com/nathaliacuryde-88/iamin_CLONE/blob/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/README.md
- All PNG files (300×300, transparent): https://github.com/nathaliacuryde-88/iamin_CLONE/tree/228ca0ee4a7d4b7220187d2a88af17cb84efecd3/marketing/brand/stickers/png
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

## Not part of this round
- The new colours, fonts and layouts (direction B, dark + light) — a separate set of prompts later.
- Seasonal demo page and anything people type themselves keep their emojis.
