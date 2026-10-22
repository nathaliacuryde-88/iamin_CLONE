# v4 — all main screens + subpages, dark and light

Look: variation 3. Space Grotesk for text, Anton for big headings, JetBrains Mono for dates, times and small labels.
Purple #7C3BED. The logo is unchanged (`Logo.tsx`).
Icons: **Phosphor** (`@phosphor-icons/react`): regular, plus fill for the active state.
Stickers are used big (32 px and up) as illustrations. Small markers use icons or dots.

| Area | Screens |
|---|---|
| Feed | Feed · Your mood sheet · Friend in the Today row (wave) · Roulette (dice) · Filter · Notifications |
| Add event | Photo empty · Photo with screenshots read · URL extracted · Manual (full form) · Cover Studio · Same night? (duplicate) |
| Calendar | Week "Upcoming" with friends away · Month with a day selected · Day timeline + empty day · Sync · Mark days unavailable · Birthday card |
| Capsule | Wallet of past nights + countdown · Sealed capsule · Opened capsule (the morning after) · Gallery · Morning-after receipt · Story recap |
| Profile | Me · Calendar (what friends see) · Friends · Edit profile · Status sheet · Settings |

## New features shown here (not in the app yet; these need building, not only a restyle)
- Capsule countdown and a sealed-capsule page.
- Capsules shown as a stacked wallet of past nights.
- Friend away: days you block can be shown to friends as "away". Their face appears on those days, plus "X is away" cards.
- Profile tabs Me / Calendar / Friends for your own profile. Friends gathers requests, top people and the friends list. The DNA card moves into Me.

Source in `source/` (open `index.html`). It expects `../phosphor.js`, `../stickers/stickers.js` and the `../a/` images from the
design scratch folder. `shoot.mjs` renders each area.
