# Time capsule reel (v1, Oct 2026)

30 s · 1080×1920 · 30 fps · −16 LUFS. Built with the "Level 2" pipeline in `../STYLE.md`.

| Step | File | Notes |
|---|---|---|
| Cast, frames, clips | `higgsfield-prompts.md` | Soul 2.0 cast (Nina A, Marie A blonde, Jonas B, Timo A) → Nano Banana Pro start frames with the cast as references → Kling 3.0 pro, 5 s, 9:16, no sound |
| App captures | `capture.mjs` | 13 Oct build + `tools/fakebackend.mjs` (copy next to it, `assets/photos` = night stills + `av_*.jpg` avatars cropped from the cast). Shots: `seal` (typing + Seal it), `open` (revealed notes), `grid` (photo slots), `list` (Capsules) |
| Film | `reel.html` | One page, every frame = f(t): time-of-day sky + clock, footage card, app card, `( )` brackets as the capsule, photos flying into the grid, purple dot → film4 end card (frames 902–975) |
| Render | `shoot.mjs` | Headless Chromium, 3 sub-frames of motion blur per frame |
| Sound | `score.py` | 120 BPM, Am–F–C–G, synth pads/arp/bass/drums + SFX on every cue, then `loudnorm I=-16` |

Labels drawn on top of the real app (call out if asked): footage chips ("Nina · getting ready"…), avatars on the sealed tiles, "🔒 Opens after the night ends", the polaroid time.
