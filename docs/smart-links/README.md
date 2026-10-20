# Smart links for shared events — recap and how to build it in Lovable

Goal: one link per event — `https://i-am-in.app/e/<eventId>` — that
1. shows a rich preview in WhatsApp / iMessage / Instagram DMs (flyer, title, date, who's in),
2. opens the **app** when it's installed (iOS Universal Links, Android App Links),
3. otherwise opens the public event page with **Get the app** (App Store / Google Play by device),
4. plus one bio link, `https://i-am-in.app/get`, that sends people to the right store.

## Where we are (checked on the live site, 20 Oct 2026)

| Piece | Status |
|---|---|
| Share URL `i-am-in.app/e/:id` (`src/lib/shareUrl.ts`) | ✅ |
| Public page `/e/:id` (`PublicEvent.tsx`) | ✅ exists — no store buttons; still has the old "no App Store needed" install text |
| `/.well-known/apple-app-site-association` (paths `/e/*`, `/event/*`) | ✅ live, served as `application/json` |
| iOS app: Associated Domains `applinks:i-am-in.app` | ❓ check in Xcode (not in the Lovable repo) |
| `/.well-known/assetlinks.json` | ❌ still `SHA256_FINGERPRINT_FROM_PLAY_CONSOLE` |
| Android app: intent-filter with `autoVerify` for `i-am-in.app` | ❓ check in Android Studio |
| In-app routing of opened links (`appUrlOpen` in `src/lib/native.ts`) | ✅ routes `/e/...` and `/event/...` |
| Link preview image (D2) — `docs/og-event-image/` | 🟡 built, not deployed; chat apps still get the generic logo card |
| Bio/store smart link `/get` | ❌ |
| Smart App Banner on iOS Safari | ❌ needs the App Store ID |

## 1 · Lovable: public event page → "Get the app"

Prompt:
> On the public event page `/e/:id` (`src/pages/PublicEvent.tsx`), replace the old "no App Store needed / install from the browser" text with a "Get the app" block:
> - Detect the device from `navigator.userAgent`: iPhone/iPad → show the App Store badge linking to `https://apps.apple.com/app/id<APP_STORE_ID>`; Android → show the Google Play badge linking to `https://play.google.com/store/apps/details?id=app.iamin.social`; desktop → show both.
> - Above the badges add a primary button "Open in I am in" that links to the same `https://i-am-in.app/e/:id` URL (on phones with the app installed, iOS/Android open the app).
> - Keep the existing RSVP flow and `setPendingRsvp`; do not change anything else.
> Use the official badge artwork (Apple and Google marketing guidelines).

## 2 · Lovable: `/get` redirect for the bio and QR codes

Prompt:
> Add a public route `/get` (no login). On load, redirect with `window.location.replace` based on `navigator.userAgent`: iOS → `https://apps.apple.com/app/id<APP_STORE_ID>?pt=<PROVIDER_ID>&ct=<campaign>&mt=8`, Android → `https://play.google.com/store/apps/details?id=app.iamin.social&referrer=utm_source%3D<campaign>`, anything else → render a simple page with both badges. Read the campaign from `?c=` (default `bio`). Don't touch other routes.

Use it as `i-am-in.app/get` in the Instagram/TikTok bio and `i-am-in.app/get?c=razzia` on QR codes, so App Store Connect "Campaigns" and Play Console show where installs come from (`pt` = your provider ID from App Store Connect).

## 3 · Lovable: Smart App Banner (iOS Safari)

Prompt:
> In `index.html` `<head>` add `<meta name="apple-itunes-app" content="app-id=<APP_STORE_ID>">`. Nothing else.

## 4 · Android App Links (before Google Play goes live)

1. Play Console → your app → *Test and release → App integrity → App signing* → copy **SHA-256 certificate fingerprint** of the *App signing key*.
2. Lovable prompt:
   > In `public/.well-known/assetlinks.json` replace `SHA256_FINGERPRINT_FROM_PLAY_CONSOLE` with `<FINGERPRINT>`. Nothing else.
3. Android project (`AndroidManifest.xml`, main activity) — not in Lovable:
   ```xml
   <intent-filter android:autoVerify="true">
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="https" android:host="i-am-in.app" android:pathPrefix="/e/" />
     <data android:scheme="https" android:host="i-am-in.app" android:pathPrefix="/event/" />
   </intent-filter>
   ```

## 5 · iOS Universal Links

The AASA file is already live. In Xcode → target **App** → *Signing & Capabilities* → **Associated Domains** → add `applinks:i-am-in.app` (and `applinks:www.i-am-in.app` if www is used). Ship it with the next build. Apple caches AASA via its CDN; changes can take ~24 h.

## 6 · Rich preview in chats (D2 image)

Follow `docs/og-event-image/README.md`: deploy `event-og-image`, update `event-share`, then route **crawlers** hitting `i-am-in.app/e/*` to `event-share`.
The live site answers with `server: cloudflare`; the Worker route only works if the `i-am-in.app` zone is in **your** Cloudflare account (DNS proxied). If the domain is managed by Lovable instead, ask Lovable support for per-route bot rewrites (option B in that README).

## 7 · Test checklist

- [ ] Send `https://i-am-in.app/e/<id>` in WhatsApp → preview shows the flyer card (after step 6).
- [ ] iPhone with the app → tap the link in Notes/Messages → opens the event in the app (long-press shows "Open in I am in").
- [ ] iPhone without the app → public page shows the App Store badge + Smart App Banner.
- [ ] Android with the app → opens in the app; `adb shell pm get-app-links app.iamin.social` shows `verified`.
- [ ] Android without the app → Google Play badge.
- [ ] `i-am-in.app/get` from iPhone, Android and desktop.
