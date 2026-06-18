## Goal
Bottom nav becomes a non-blocking floating glass pill. The feed fills the full viewport height and scrolls underneath it, with enough bottom padding so the last card clears the bar. No layout element reserves vertical space for the nav.

## Changes

### 1. `src/components/BottomNavBar.tsx` — floating, non-blocking
- Outer `<nav>`: keep `fixed left-0 right-0 bottom-0 z-[30] md:hidden`, add `pointer-events-none` so the bar never eats scroll/taps in dead space (sides of the pill).
- Inner pill container: add `pointer-events-auto` so the pill itself remains tappable.
- Replace `bg-card/60 backdrop-blur-xl` with explicit glass: `backdrop-blur-[24px] backdrop-saturate-150 bg-background/55` plus existing border/shadow, so cards remain visible underneath.
- Plus button + label: also `pointer-events-auto`.
- Keep current `bottom: calc(0.75rem + env(safe-area-inset-bottom))` offset.

### 2. `src/components/AppLayout.tsx` — stop reserving vertical space
- `<main>`: remove the `pb-28` / `paddingBottom: calc(6rem + env(safe-area-inset-bottom))`. Pages that need bottom clearance own it. (Set `paddingBottom: 0` for both mobile and desktop; keep `paddingTop` for top bar.)
- `BottomNavBar` stays as the last sibling of `<main>` (already the case).

### 3. `src/components/WalletStack.tsx` — full-screen feed, scroll under nav
- Remove all bottom-nav-aware math: delete `BOTTOM_NAV_RESERVE_PX`, `safeBottom` probe, `bottomReserve`, `visibleH`, and the `padBottom = max(containerH*0.6, …)` hack.
- Scroll container height: drop the JS-measured `measuredH` and use `height: 100dvh - 3.5rem - env(safe-area-inset-top)` so the deck spans the full screen under the top bar. (Keep `overflow-y-auto`, snap, perspective.)
- `scrollPaddingBottom`: set to `calc(128px + env(safe-area-inset-bottom))` so snap-to-center lands cards above the floating nav.
- Inner content wrapper (`<div style={{paddingTop, paddingBottom}}>`): set `paddingBottom: calc(128px + env(safe-area-inset-bottom))` so the last card visually clears the nav while still being scrollable past it.
- `effectiveCardHeight`: clamp against `containerH - 16` only (no bottomReserve subtraction) so cards keep their full size.
- IntersectionObserver `rootMargin`: change bottom inset to `-128px` (matches the nav clearance) so the focused card is whatever sits above the bar.

### 4. `src/pages/Index.tsx` — no per-page footer/reserve
- Confirm `WalletStack` is rendered without `footer` (already done) and no extra bottom padding wrappers. No code change expected beyond verification; remove the lingering `/* footer removed */` comment.

### 5. `src/index.css` — keep `feed-locked`, no overflow on inner wrappers
- Leave `html.feed-locked / body.feed-locked` as-is (only the outermost frame clips). No other `overflow:hidden` exists on wrappers between the cards and root (verified via search), so no further changes.

## Result
- Bottom nav floats over the feed; cards are visible behind it via the glass blur.
- Feed scroll area = full viewport under the top bar; last cards reachable with `128px + safe-area` clearance.
- Nav no longer intercepts scroll outside the pill (`pointer-events-none` wrapper + `pointer-events-auto` pill).
- Other pages: removing `<main>`'s `pb-28` means any page that currently relied on it should add its own bottom padding if needed — quick visual check on Calendar, Capsule, Profile after the change; add `pb-28` locally where required.
