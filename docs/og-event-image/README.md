# Event share image (D2) — how it was built and how to add it in Lovable

When someone shares an event link, chat apps (WhatsApp, iMessage, Telegram, Slack…) show a 1200×630 card:
flyer on the left, date · title · place · "N people are in" with avatars, an "I'm in" button and the logo.

Examples: `examples/event-flyer.jpg`, `examples/event-emoji-cover.jpg`, `examples/private-or-unknown.jpg`.

## What's in this folder

| File | Goes to (in the Lovable project) | What it does |
|---|---|---|
| `event-og-image/index.ts` | `supabase/functions/event-og-image/index.ts` (new) | Edge function: `GET /functions/v1/event-og-image/<eventId>.jpg` → JPEG 1200×630 |
| `event-og-image/render.ts` | `supabase/functions/event-og-image/render.ts` (new) | satori (layout → SVG) + resvg-wasm (SVG → pixels) + jpeg-js (→ JPEG ~60–120 KB) |
| `event-og-image/layout.ts` | `supabase/functions/event-og-image/layout.ts` (new) | The design (plain objects, no JSX) |
| `event-share/index.ts` | replaces `supabase/functions/event-share/index.ts` | Uses the new image as `og:image` (see `event-share.diff`) |

## How it works

1. `event-share` (already exists) returns the HTML with the Open Graph tags for an event.
   Its `og:image` now points to `/functions/v1/event-og-image/<id>.jpg?v=<updated_at>`.
2. `event-og-image` calls the existing RPC `get_public_event_card` (same one the public page `/e/:id` uses), so it only ever sees
   public data: `name, date, time, location, city, image_url, description (emoji cover), going_count, avatars`.
   - Private or unknown event → neutral brand card (`I am (IN)` + "Keep track and share your events"). Nothing leaks.
   - No flyer → emoji cover (Twemoji) on its colour, or the big logo.
   - Flyer/avatars in WebP/AVIF or unreachable → skipped (satori can't decode them) instead of failing.
3. Rendering: fonts (Space Grotesk 500/700), the resvg WebAssembly and Twemoji SVGs are fetched from jsDelivr on the first request
   of each function instance and kept in memory. First render ≈ 1–1.5 s, then ≈ 0.6 s. The response is cached
   (`max-age=600, stale-while-revalidate=1 day`).
4. Copy is "N people are in" (not "friends"): the crawler that builds the preview isn't logged in, so it can't know who your friends are.

## Steps in Lovable

1. Create the 3 files of `event-og-image/` in `supabase/functions/event-og-image/`.
2. Replace `supabase/functions/event-share/index.ts` with `event-share/index.ts` (or apply `event-share.diff`).
   The old `emojiCoverSvg`/`parseCoverMeta` helpers are now unused there; they can stay or be deleted.
3. Add to `supabase/config.toml`:
   ```toml
   [functions.event-og-image]
     verify_jwt = false
   ```
4. Deploy both functions. Prompt you can paste in Lovable:
   > Add a new Supabase edge function `event-og-image` with these three files (index.ts, render.ts, layout.ts) exactly as given,
   > set `verify_jwt = false` for it in supabase/config.toml, replace supabase/functions/event-share/index.ts with the given file,
   > and deploy both functions. Don't change anything else.
5. Test the image directly in the browser:
   `https://<project-ref>.supabase.co/functions/v1/event-og-image/<a-public-event-id>.jpg`

## Important: the link people share must reach `event-share`

WhatsApp doesn't run JavaScript. It reads the HTML of the exact URL in the message. Today the app shares
`https://i-am-in.app/e/<id>` (`src/lib/shareUrl.ts`), and that URL returns the static `index.html` with the generic tags, so
**chat apps never see `event-share` and won't show this image until one of these is in place**:

- **Option A (recommended) — crawler rewrite on the domain.** If `i-am-in.app` goes through Cloudflare, add this Worker on the route
  `i-am-in.app/e/*`. Chat crawlers get the `event-share` HTML (with the new image); people keep getting the normal app.
  ```js
  export default {
    async fetch(req) {
      const url = new URL(req.url);
      const ua = req.headers.get("user-agent") || "";
      const id = url.pathname.split("/")[2];
      const bot = /whatsapp|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot|linkedinbot|skypeuripreview|applebot|iMessage|bot|crawler|spider/i.test(ua);
      if (bot && /^[0-9a-f-]{36}$/i.test(id)) {
        const r = await fetch(`https://<project-ref>.supabase.co/functions/v1/event-share/${id}`, { headers: { "user-agent": ua } });
        return new Response(await r.text(), { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
      }
      return fetch(req);
    },
  };
  ```
  (The Worker sets `text/html` itself; the Supabase function host alone serves HTML as plain text, which is why the app stopped
  sharing the function URL directly.)
- **Option B — check with Lovable support** whether the hosting supports per-route meta tags / rewrites for bots. If yes, point
  `/e/:id` for bots to the `event-share` function the same way.

Without A or B the function still works (you can open the image URL), but previews keep showing the generic logo card.

## How it was tested here

`layout.ts` + `render.ts` were run in Node with the same packages and versions (satori 0.56.2, @resvg/resvg-wasm 2.6.2,
jpeg-js 0.4.4, Space Grotesk from @fontsource 5.0.18, @twemoji/svg 15.0.0), with the network calls pointed at local copies.
Cases: flyer + 4 avatars, emoji cover, WebP flyer + missing avatar (falls back to the emoji cover), private event.
Not tested here: the Deno/Supabase runtime itself and the live RPC — check step 5 after deploying.
