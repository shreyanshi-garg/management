# Self Management

A personal productivity app with six sections — dashboard, money, time, tasks, goals, and health.
Data lives in Supabase and is scoped to a **space**, so more than one person can use the same
deployment. Sign-in is Google OAuth through Supabase Auth; access to a space is granted by adding
someone's Google address to its member list, and Postgres RLS enforces that server-side.

Supabase is the only store for app data. The session itself is kept by supabase-js in
`localStorage`, so a reload keeps you signed in, and it expires 24h after sign-in.

## Stack

- **Vite** + **React 19** (plain JSX, no TypeScript)
- **Tailwind CSS v4** — configured in `src/index.css` via `@theme`, no `tailwind.config`
- **Supabase** — Postgres + Auth (Google OAuth), accessed directly from the browser
- **oxlint** for linting
- `recharts` (money charts), `date-fns`, `lucide-react`, `canvas-confetti`

## Setup

Create a `.env` in the project root:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Then:

```
npm install
npm run dev
```

Enable the Google provider in Supabase Auth and add the dev/deploy origins to its redirect
allowlist — the app uses `window.location.origin` as the OAuth callback and has no router.

Apply `supabase/migrations/001` … `003` in order from the Supabase SQL editor. `004_rollback.sql`
is commented-out escape hatches for when RLS locks you out; nothing in it runs in the happy path.

A space with no rows yet seeds its own defaults on first load — six habits and seven expense
categories (see `DEFAULT_HABITS` and `DEFAULT_EXPENSE_CATEGORIES` in `src/context/AppContext.jsx`).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | oxlint |

## Layout

```
src/
  App.jsx              auth gate → space picker → section routing (local state, no router)
  context/
    AuthContext.jsx    Google sign-in, session, 24h expiry
    SpaceContext.jsx   space list and membership
    AppContext.jsx     all app data: loaders, mutations, first-run seeding
  components/          one folder per section, plus auth/, spaces/, layout/ and shared/
  hooks/               useHabitStats, useTimer
  utils/               date.js (dayKey / parseDay), habitStats.js
  lib/supabase.js      Supabase client
supabase/migrations/   RLS setup, applied by hand in the SQL editor
```
