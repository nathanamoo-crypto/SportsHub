# SportsHub

SportsHub is a web platform for running local competitions end-to-end: create competitions, register teams and squads, schedule fixtures, record results and match events, and get automatic standings and player statistics.

Built with React + TypeScript + Vite on the frontend and Supabase (Postgres + Row Level Security + Storage) on the backend.

## Features

- **Auth & roles** — email/password authentication with organizer and player roles (Supabase Auth).
- **Competitions** — create drafts, publish them, browse public competitions with search and filters, and preview their detail pages.
- **Teams & squads** — global teams (so they can enter many competitions), optional manager, logo uploads to Supabase Storage, and squads with positions and shirt numbers.
- **Fixtures** — schedule matches for registered teams with stages, venues, kickoff times, and public match pages.
- **Results & events** — record scores, plus a timeline of goals, assists, and cards per match.
- **Automatic statistics** — standings and player/team leaders derived in Postgres views (`vw_standings`, `vw_player_stats`, `vw_team_stats`).
- **Production polish** — responsive layout, sticky mobile nav, toasts, confirm dialogs, skeletons, empty states, network error recovery, SEO titles, and SPA-ready deployment.

## Tech stack

- React 18 + React Router + React Hook Form
- TypeScript (strict)
- Tailwind CSS
- Supabase (Auth, PostgreSQL, Row Level Security, Storage)
- Vite, ESLint (typescript-eslint, react-hooks, react-refresh)

## Getting started

Requirements: Node.js 18+ and npm.

```bash
npm install
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Then add your Supabase project credentials:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Start the dev server:

```bash
npm run dev
```

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the Vite dev server            |
| `npm run build`      | Type-check then build for production |
| `npm run preview`    | Preview the production build         |
| `npm run lint`       | Run ESLint                           |
| `npm run typecheck`  | Run the TypeScript compiler          |

## Database setup

The database schema, row level security policies, and derived-statistics views live as numbered SQL migrations in [`supabase/migrations/`](supabase/migrations). Apply them to your Supabase project in order (e.g. via the Supabase dashboard SQL editor or `supabase db push`).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data model and security model, and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the production release checklist.

## Project structure

```
src/
  components/   Reusable UI components (cards, badges, dialogs, timeline, auth guards)
  context/      Auth and Toast providers
  hooks/        Shared hooks (useAuth, usePageMeta)
  pages/        Route components (public, organizer, auth)
  services/     Supabase data-access layer (one module per domain)
  styles/       Global styles and Tailwind theme
  types/        Domain types shared across the app
  utils/        Formatting and validation helpers
supabase/
  migrations/   SQL migration files (schema, RLS, views, storage policies)
```

## License

Private project for portfolio purposes.