# Memory: index.md
Updated: today

# Project Memory

## Core
Dark mode nightlife glassmorphism theme. Primary purple #7C3AED is the ONLY accent — all hovers/highlights use primary. No amber/pink secondary accents.
Supabase via Lovable Cloud. Google OAuth via Lovable managed auth. Firecrawl connector linked.
Event-centric social app: events, attendees, follows, profiles, comments, time_capsule_photos, notifications tables.
Events have visibility (public/tentative). Ghost (tentative) events are visible to mutual friends as a blurred placeholder; non-friends don't see them at all.
Events are considered "past" at end-of-day (midnight) of `event.date` — they then move to Time Capsule.
Mobile bottom nav: Feed | Calendar | (centered + button) | Capsule | Profile.

## Memories
- [Design tokens](mem://design/tokens) — Nightlife glassmorphism dark theme, glow effects
- [DB schema](mem://features/db-schema) — profiles, events, attendees, follows, user_roles, comments, time_capsule_photos, notifications
- [Auth flow](mem://features/auth) — Email/password + Google OAuth, auto-profile on signup
- [AI ingestion](mem://features/ai-ingestion) — Screenshot vision parsing + URL scraping via Firecrawl + AI extraction with vibe_category
- [Social features](mem://features/social) — Comments with @mentions → notifications, time capsule (24h photo dump), ghost mode (mutual-friend visibility), conflict alerts, FOMO heatmap
- [Cover meta encoding](mem://features/cover-meta) — Emoji+color event covers stored as `[[cover:EMOJI|HSL]]` prefix in description
