# I am (IN) — app prototype (v5, from the reference folders)

One clickable prototype with every section, in light and dark mode. It is the visual and behavioural spec for the Lovable build.

- Live prototype: https://claude.ai/artifact/9P3FZqahZUCttikKAPEVN4
- Onboarding (stories + setup): https://claude.ai/artifact/P7FtvPMCRBhRJ4TQUKUpuE (source in `../onboarding-prototype`)

## Build

```
python3 build.py          # writes index.html (artifact) and preview.html (local)
PW=<playwright path> node shot.mjs "s|feed" "h|roulette"   # screenshots to shots/
```

Sources live in `src/`: `head.html` (tokens + shared classes), `body.html`, then one JS file per section, in this order: `core.js` (helpers, data, router), `feed.js`, `event.js`, `add.js`, `cal.js`, `cap.js`, `me.js`, `tab.js`, `home.js`. Icons are the original Lucide set (`src/lucide.json`), stickers come from `src/stickers.js`.

## Sections

The side panel tags each screen: **New** (new feature), **New look** (existing feature, redesigned), **Existing**, **Native** (iOS/Android work outside the web app).

| Section | What it shows |
|---|---|
| Feed | Today row (thought bubbles + sticker), vertical card carousel (neighbours smaller and darker), Maybe / I'm in, reaction counters, Roulette, Note, Notifications |
| Filter | "Mix your night": vibe-sticker board, friends-going dial, With, date range, live result count |
| Event page | Ticket sections with sticky torn-ticket bar, sticker layer on the flyer, Live radar (compass) |
| Add | Fanned screenshots + big plus, full form, event-art studio (background, stickers, text, frame & shadow, light, base) |
| Calendar | Month (flyer circles, spend, stats, birthdays, friend away, blocked days) and Agenda (giant day numbers); sync, block, birthday sheets |
| Capsule | v4 design: wallet of nights, countdown, sealed, morning after, gallery, receipt, story, prediction |
| Profile | Me / Calendar / Friends tabs, bio look with sticker badges, widgets in Me, status sheet |
| The tab | Split-the-bill screen and Add expense sheet |
| Home screen | Home-screen widgets and app-icon quick actions (native) |

No existing feature is removed; everything new is tagged **New**.
