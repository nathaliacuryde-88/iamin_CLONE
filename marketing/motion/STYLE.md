# I am (IN) — motion style for app films

Reference: `iamin-film4-3d-v2` (Oct 2026). Use this as the bar for every new video and every correction.

## Format
- 1080×1920, 30 fps, H.264 (yuv420p, bt709), ~30–35 s, no audio unless asked.
- One film per app page (feed, calendar, event page, capsule…).
- English copy. Headline top-left, white, last word in brand purple `#7E4AF1`/`#8B5CF6`, Space Grotesk 700.
- Background near-black `#090A0F`. No purple backgrounds.
- Ending: "Less scrolling. More going." → purple dot burst → `I am (IN)` logo → "Get in · i-am-in.app" (reuse film7 frames).

## What "good" looks like
- **Mix flat and 3D.** Most scenes are the real app full-bleed (flat). 2–3 moments per film use a **real 3D iPhone** (three.js, `tools/phone3d.html`) with distinct moves:
  - hero turn (phone pulls back from full-bleed, turns, pushes back in),
  - phone lying on a table (map-like tilt) with UI elements lifting out in 3D (avatars on purple stems),
  - story beats with the phone as a character (face-down + animated "z z z" → vibrates → flips over → content flies into the screen → camera dives into the screen).
- **Seamless flat ↔ 3D.** Every 3D shot starts and ends exactly on a film frame: screen at full-bleed, Dynamic Island + glass sheen faded out at full-bleed (pixel diff < 1).
- **No hard cuts on screens.** When the phone tilts, the rest of the real page must be visible below (capture the app taller, composite real content under the film crop).
- **2D × 3D pins (signature look).** When the phone lies flat or tilts, pick a few UI elements and pop them out of the screen into 3D, while the screen keeps the flat (2D) version underneath:
  - the element (avatar, pin, badge) floats above its exact spot as a camera-facing sprite (~1.25× its flat size),
  - a thin purple stem (`#8B5CF6`) connects it down to the screen,
  - a soft purple disc (~35% opacity) marks the spot on the screen where it came from (the flat element is masked there so it doesn't appear twice),
  - lift with ease-out, stagger heights slightly (1×, 1.35×), hold, then drop back down before returning to flat full-bleed.
  - Good candidates: radar avatars, map pins, RSVP avatars on a card, reaction emojis, the "I'm in" badge, calendar dots/birthday cakes. Use it once or twice per film, not on every scene.
- Things fly **into** the phone (photos, notes) and land exactly where the app shows them, then the texture swaps to the real screen.
- Real app captures only (fake backend `tools/fakebackend.mjs`), demo data, fictional "Nina Alves" for the owner. Labels/chips added on top are allowed but should be called out.
- Taps: white dot + ring. Toggles/changes must show the real state change (e.g. Maybe = outline circle).
- Transitions: soft fades or elements from the scene for calendar-style films; film4 keeps its slide/blur/glitch language. Never flash between identical screens.
- **Stories safe zone:** keep the top ~240 px of the 1080×1920 frame empty (dark background) — the profile row and the Instagram link sticker live there. The top of the text block (eyebrow or first headline line) sits at **y ≈ 240–250** in every scene, same height as "How long's the line?" / "Leave a note for later." in film4 v4. Not lower: y ≥ 300 felt too low. Full-screen moments (opening title, phone-asleep 3D beat, purple burst → logo) keep their own centred layout.
- Fixing an existing film: shift each scene down by `245 − headline top` (crop the bottom, fill the top with `#090A0F`), ramp the shift across the existing transitions, and extend the top row with a fade to the background on slide/blur frames so no hard band shows.
- Tags and interactions sit high in the frame (under the headline / on top of the phones), never at the bottom where social UI covers them.

## Tools
- `tools/phone3d.html` — three.js iPhone (titanium frame, camera plateau, buttons, island, screen texture, fliers, zzz, avatar lifts, `fullBleed(topRow)`).
- `tools/shots.mjs` — example shot scripts (razzia hero turn, radar lying down, morning-after flip). Serve the folder over HTTP and run headless Chromium with SwiftShader WebGL.
- `tools/cal.mjs` — app capture script (calendar), pattern for any page.
- Strip PNG gamma chunks from ffmpeg frames before using them in the browser, otherwise colours shift.
