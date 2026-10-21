# I am (IN) stickers — 53 stickers that replace the emojis in the app UI

Boards: `sticker-board-dark.jpg`, `sticker-board-light.jpg`.
Files: `png/<id>.png` (300×300, transparent, white die-cut outline + shadow — ready for the app),
`svg/<id>.svg` (vector; the outline is an SVG filter, text uses Anton / Inter Tight / JetBrains Mono).
Source: `source/stickers.js` (all drawings + the mapping below), `source/board.html`, `source/shoot.mjs`.

## Rules
- No emojis in app chrome: tabs, headers, buttons, badges, chips, toasts, empty states, notifications.
- Emojis people type stay: chat, notes, captions, comments, Cover Studio "type any emoji".
- Stickers pop in with a small bounce (scale 0.6 → 1.08 → 1, ~250 ms) and a light haptic.
- Avatar without a photo: initials in Anton on a sticker colour (lime, pink, blue, yellow, orange) instead of `lib/avatarEmoji.tsx`.
- Line mode 🟢🟡🔴⛔: plain coloured dots + a word. Functional emojis (🔗 💳 🌐 🚫 🔔 📝 👁️ ⚠️, arrows) → line icons or text.

## Moods (Your mood today) & status on avatars

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/disco.png) `disco` | Out tonight | 🔥 🪩 | OutTonightBar vibe_out |
| ![](png/spritz.png) `spritz` | Drinks | 🍸 🍹 | vibe_drinks |
| ![](png/sneaker.png) `sneaker` | Dancing | 💃 | vibe_dancing |
| ![](png/couch.png) `couch` | Chill hang / still home | 🛋️ | vibe_chill, LiveRadar |
| ![](png/sun.png) `sun` | Day event / sunny | ☀️ | vibe_day, CoverStudio |
| ![](png/ball.png) `ball` | Sport | ⚡ ⚽ | vibe_sport, categories |
| ![](png/key.png) `key` | At mine | 🏠 | new mood |
| ![](png/free.png) `free` | Free tonight | 🟢 | StatusBadge available |
| ![](png/moon.png) `moon` | Not tonight / late | 🌙 | StatusBadge, PactSection |
| ![](png/battery.png) `battery` | Low energy | 😴 | StatusBadge, StatusSheet |

## Reactions, exit poll & scores

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/flame.png) `flame` | Fire / worth it | 🔥 | ReactionPicker, ExitPoll, EventScoreStrip |
| ![](png/eyes.png) `eyes` | Looking / are you in? | 👀 | ReactionPicker, reality check |
| ![](png/skull.png) `skull` | Dead / flop | 💀 | ReactionPicker, ExitPoll |
| ![](png/cheers.png) `cheers` | Cheers / brunch | 🥂 | ReactionPicker, categories |
| ![](png/heart.png) `heart` | Love | ❤️ 💖 💜 | ReactionPicker, cards |
| ![](png/popper.png) `popper` | Party | 🎉 🥳 🎊 | ReactionPicker, categories, toasts |
| ![](png/meh.png) `meh` | Mid | 😐 | ExitPoll, EventScoreStrip |
| ![](png/burst.png) `burst` | Score (number on top) | ★ ⭐ 🏅 | NightReceipt, CreatorScore |
| ![](png/maybe.png) `maybe` | Maybe | 🤔 🤷 | Maybe states |
| ![](png/in.png) `in` | I'm in / confirmed | ✅ ✋ | RSVP, EventPulse, notifications |

## Event categories

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/vinyl.png) `vinyl` | Music | 🎵 🎶 | FilterSheet, EventCard, AddEvent |
| ![](png/popper.png) `popper` | Party | 🎉 | FilterSheet |
| ![](png/tent.png) `tent` | Festival | 🎪 | FilterSheet |
| ![](png/cake.png) `cake` | Birthday | 🎂 | FilterSheet, birthdays |
| ![](png/palette.png) `palette` | Art | 🎨 | FilterSheet |
| ![](png/pizza.png) `pizza` | Food | 🍽️ 🌮 | FilterSheet |
| ![](png/croissant.png) `croissant` | Brunch | 🥂 ☕ | FilterSheet |
| ![](png/popcorn.png) `popcorn` | Cinema | 🎬 | FilterSheet |
| ![](png/ball.png) `ball` | Sports | ⚡ | FilterSheet |
| ![](png/tote.png) `tote` | Street markets | 🛍️ | FilterSheet |

## On the night: radar, pacts, ghosts, the line, the tab

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/pin.png) `pin` | I'm there / location | 📍 🎉 | LiveRadar, EventDetail |
| ![](png/scooter.png) `scooter` | On the way | 🛵 🚶 | LiveRadar |
| ![](png/radar.png) `radar` | Live radar | 📡 | LiveRadarSection, MapSheet |
| ![](png/seal.png) `seal` | Pact sealed | 🤝 | PactSection, notifications |
| ![](png/ghost.png) `ghost` | Ghost / let it fade / knock | 👻 | EventPulse, GhostKnock, FriendGhostCard |
| ![](png/dice.png) `dice` | Roulette | 🎲 | Roulette sheet |
| ![](png/ticket.png) `ticket` | Walk-in / the line | 🟢 🎟️ | Line mode, notifications |
| ![](png/receipt.png) `receipt` | The tab / receipt | 🧾 | NightReceipt, expenses |
| ![](png/cash.png) `cash` | Paid / money | 💸 💳 | payments, Onboarding |

## Capsule & memories

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/cam.png) `cam` | Capsule / photos | 📸 | TimeCapsule, AddEvent |
| ![](png/film.png) `film` | Recap / reel | 🎞️ | CapsuleDetail |
| ![](png/crystal.png) `crystal` | Prediction | 🔮 | RevealedPredictions, TimeCapsule |
| ![](png/lock.png) `lock` | Sealed / private | 🔒 | EventDetail, capsules |
| ![](png/calendar.png) `calendar` | Date / plans | 🗓️ 📅 | calendar, notifications |

## Birthdays

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/cake.png) `cake` | Birthday | 🎂 🍰 | BirthdayCardComposer/Reveal |
| ![](png/balloon.png) `balloon` | Balloon | 🎈 | Birthday cards |
| ![](png/gift.png) `gift` | Gift | 🎁 | Birthday cards, ConvertMaybes |
| ![](png/bottle.png) `bottle` | Bubbles | 🍾 | Birthday cards |
| ![](png/plus1.png) `plus1` | +1 / party | 🥳 🎊 | Birthday cards, calendar |

## Notifications & everything else

| Sticker | Use | Replaces | Where in the code |
|---|---|---|---|
| ![](png/envelope.png) `envelope` | Invite | 💌 | NotificationsBell, Calendar |
| ![](png/hey.png) `hey` | Friend request / wave | 👋 | NotificationsBell, Welcome, Onboarding |
| ![](png/clock.png) `clock` | Reminder | ⏰ | payment_reminder |
| ![](png/spark.png) `spark` | New / glow | ✨ ✦ 💫 🌟 | new_follower, toasts, CoverStudio |
| ![](png/crown.png) `crown` | Super host | 👑 | organizer SuperHostsCard |
| ![](png/brokenheart.png) `brokenheart` | Slipping away | 💔 | organizer SlippingAwayCard |
| ![](png/wave.png) `wave` | Chill / pool | 🌊 🌴 | CoverStudio presets |