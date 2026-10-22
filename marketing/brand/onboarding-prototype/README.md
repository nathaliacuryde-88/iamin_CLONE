# Onboarding prototype

Live: https://claude.ai/artifact/P7FtvPMCRBhRJ4TQUKUpuE (private until shared).

The onboarding opens with a story, then moves to setup.
- **Person:** logo intro → Person or organizer → 4 story slides (plans · who's in · the night · the morning after) → Get in → name · photo + first mood (new) · birthday · city · find friends (new) · settle-up handles · notifications (new) → You're in.
- **Organizer:** logo intro → choice → 2 story slides (audience · track record) → Get in → organizer name · Instagram/website · Stripe · notifications → You're in.

How the stories behave: they auto-play for 5.6 s each. Tap right to go on, tap left to go back, hold to pause. The X skips straight to "Get in". The theme follows the phone (light/dark).

Files:
- `src.html`: the page to edit.
- `build.py`: inlines `stickers.js` and `lucide_ob.json` into `index.html`.
- `assets/`: cast photos and flyers. They are placeholders for real photos.
- `shot.mjs`: screenshots every screen.

Rebuild with `python3 build.py stickers.js lucide_ob.json`.
