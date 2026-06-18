# iamin

A mobile-first social/event app built with Vite + React + TypeScript, using
shadcn/ui, Tailwind CSS, Supabase, and Capacitor (iOS/Android). Originally
scaffolded in [Lovable](https://lovable.dev).

## Prerequisites

- Node.js 20+ (developed against Node 22)
- npm (a `bun.lock` is also present; this repo currently installs via npm)

## Setup

```bash
# Install dependencies (the lockfile has a known peer-dep mismatch
# between date-fns v4 and react-day-picker, so use legacy peer deps)
npm install --legacy-peer-deps

# Create your local env file from the template and fill in Supabase values
cp .env.example .env
```

Required environment variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key |

## Scripts

```bash
npm run dev        # start the Vite dev server on http://localhost:8080
npm run build      # production build to dist/
npm run preview    # preview the production build
npm test           # run the test suite once (vitest)
npm run test:watch # run tests in watch mode
npm run lint       # run eslint
```

### Dev server host

The dev server binds to `::` (IPv6) by default to match Lovable. On
environments without IPv6, override the host:

```bash
VITE_DEV_HOST=0.0.0.0 npm run dev
```

## Testing

Tests use [Vitest](https://vitest.dev/) with `jsdom` and Testing Library.
Test files live next to source as `*.test.ts(x)` / `*.spec.ts(x)` under `src/`.
Global setup is in `src/test/setup.ts`.

## Project structure

- `src/` — application source (components, pages, sheets, hooks, assets)
- `supabase/` — Supabase edge functions and config
- `public/` — static assets (icons, manifest)
- `.lovable/` — Lovable project memory and plans
- `capacitor.config.ts` — native (iOS/Android) wrapper config

## Notes

- `.env` is gitignored; never commit real keys. Use `.env.example` as the template.
- Lint currently reports pre-existing issues inherited from the Lovable
  scaffold (mostly in generated `src/components/ui` files).
