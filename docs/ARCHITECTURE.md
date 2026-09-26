# Architecture

## Overview

SportsHub is a single-page React app backed by Supabase. The frontend talks to the database through a thin service layer; every table is protected by Row Level Security (RLS) and annotated with `security_invoker = true` so policies always run with the API role's privileges.

```
┌─────────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│ React (Vite)        │ ──▶ │ Services layer        │ ──▶ │ Supabase           │
│ pages → components  │     │ src/services/*.ts     │     │ Postgres + RLS     │
└─────────────────────┘     └──────────────────────┘     │ + Auth + Storage   │
                                                           └────────────────────┘
```

## Layers

### UI (`src/pages`, `src/components`, `src/layouts`)
- Route components live in `src/pages` (public pages at the top level, organizer-only pages under `src/pages/organizer`).
- Shared UI lives in `src/components`: `StatusBadge`, `Skeleton`, `EmptyResults`, `NetworkError`, `SearchBar`, `FilterDropdown`, `ConfirmDialog`, `MatchTimeline`, `StandingsTable`, `PlayerLeaders`, `LogoUploader`, plus the `ProtectedRoute` / `OrganizerRoute` guards and page widgets.
- `MainLayout` wraps routes with the sticky responsive navbar and footer.

### State & context (`src/context`, `src/hooks`)
- `AuthContext` / `AuthProvider` — session state from `supabase.auth`.
- `ToastContext` / `ToastProvider` — global toast notifications rendered at the top of the screen.
- `usePageMeta(title, description?)` — sets `document.title` and the description meta tag per page.
- `useAuth` — convenience hook for the current user and roles.

### Services (`src/services`)
One module per domain, all thin wrappers over the Supabase client:
- `auth.ts` — sign in/up, password reset.
- `competitions.ts` — competition CRUD, publishing, deletion, public browsing.
- `teams.ts`, `squads.ts`, `players.ts` — teams, squad management, player lookup.
- `fixtures.ts`, `matchEvents.ts` — matches, results, event timeline.
- `statistics.ts` — standings and player/team leaders from the derived views.
- `storage.ts` — team logo upload/delete in the `team-logos` bucket.
- `supabase.ts` — client bootstrap; all services no-op when env vars are missing via `notConfiguredResult()`.

### Types (`src/types/domain.ts`)
Shared domain types for every table plus embedded (joined) shapes used by the service layer.

## Data model

Migrations are numbered and stored in `supabase/migrations/`:

| Migration | Concern |
| --------- | ------- |
| `001–015` | Profiles, roles, sports, formats, venues, teams, players, competitions, squads, fixtures, match events, reference seed data, auth trigger. |
| `016`     | RLS baseline policies on core tables. |
| `017–021` | RLS for competitions, teams, matches, and match events. |
| `022`     | Cascade delete of a draft competition and its fixtures. |
| `023`     | Derived statistics views (`vw_standings`, `vw_player_stats`, `vw_team_stats`). |
| `024`     | `team-logos` storage bucket and its access policies. |

Key relationships:
- `competitions` — organizer-owned, one sport and one format.
- `competition_teams` — join for teams entering a competition (active/rejected/removed).
- `teams` — global, owner-managed, optional `manager_id` profile.
- `team_players` — a team's squad; players are shared rows in `players`.
- `matches` — home/away registration links, venue, stage, kickoff, score, status.
- `match_events` — goals, assists, cards tied to a match and a player.

## Derived statistics

`023_create_statistics_views.sql` computes, in SQL:
- **Standings** — points (3/1/0), wins/draws/losses, goals for/against/difference, sorting by points then goal difference then goals for.
- **Player leaders** — top scorers, top assists, most yellow cards.
- **Team stats** — played, won, drawn, lost, goals, and points.

Views filter to `published` competitions and `completed` matches and are created with `WITH (security_invoker = true)` so callers only see rows the RLS policies allow.

## Security model

- RLS is enabled on every business table (migrations `016`–`021`).
- Authenticated users read almost everything; writes are gated by ownership:
  - competitions — `organizer_id = auth.uid()`;
  - teams — `owner_id = auth.uid()`;
  - matches/events — via the competition owner or team ownership.
- Storage: the `team-logos` bucket is public for reads; writes use a policy that checks `auth.role() = 'authenticated'` and that the requested team belongs to the caller (verified by joining the object path's team id back to `teams`).

## Recurring patterns

- **Async data loading** — fetch inside `useEffect` with an `active` guard to avoid stale updates after unmount; loading state is derived from `data === null`.
- **Unified results** — services return `{ data, error }`; data is `null` on failure so pages can branch cleanly.
- **Confirmations & toasts** — destructive actions use `ConfirmDialog`; success/errors surface via `useToast()`.
- **Forms** — React Hook Form (v7) with inline validation; large lookup lists use controlled state rather than `watch()`.

## Lint & type rules

- `npm run typecheck` — `tsc --noEmit` with strict mode.
- `npm run lint` — ESLint with `typescript-eslint`, `react-hooks` (exhaustive-deps, set-state-in-effect), and `react-refresh` (context/hook split from provider components).
- Type-only imports must use `import type`.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the release checklist.