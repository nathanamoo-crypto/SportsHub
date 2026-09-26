# Deployment checklist

## 1. Database migrations

Apply all migrations in [`supabase/migrations/`](../supabase/migrations) to your Supabase project in numeric order (`001` → `024`). The latest migration, `024_storage_and_bucket_policies.sql`, creates the public `team-logos` bucket and its storage policies, so it must be applied before logo uploads will work.

Suggested order of execution:
1. Run `001`–`023`.
2. Run `024` (storage).

If you use the Supabase CLI:

```bash
supabase db push
```

Or open the SQL editor in the Supabase dashboard and run each file in order.

## 2. Environment variables

Create a `.env` file (or set these in the hosting dashboard):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Use the **anon** (publishable) key — the backend RLS enforces access, never the client key.

## 3. Build

```bash
npm install
npm run build   # runs typecheck then vite build
```

The `dist/` folder is the deployable artifact.

## 4. Deploy the frontend

### Vercel
- Framework preset: **Vite**.
- Build command: `npm run build`
- Output directory: `dist`
- Add the two environment variables from step 2.

The included [`vercel.json`](../vercel.json) rewrites all unmatched routes to `/index.html` so client-side routing (e.g. `/competitions`, `/matches/123`) works on reload.

### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Add a `/*  /index.html  200` rewrite rule (via a `_redirects` file or the dashboard) for SPA support.

## 5. Post-deploy verification

- [ ] Home page loads with no console errors.
- [ ] `/competitions` lists published competitions and search/filter work.
- [ ] `/teams` lists teams from published competitions.
- [ ] Sign in as an organizer; competition drafts can be created, published, and deleted.
- [ ] Teams can be created and a logo can be uploaded and replaced; `team-logos` bucket shows the object at `teams/<id>/logo`.
- [ ] Fixtures can be scheduled and results/events recorded; the public match page shows the timeline once completed.
- [ ] Standings and player leaders render on a published competition page.
- [ ] Visiting an unknown path returns the 404 page (SPA rewrite works).
- [ ] Non-organizer users are redirected to `/unauthorized` on organizer routes.

## 6. Maintenance

- Schema changes go through new numbered migrations — never edit applied migrations on a live project.
- The statistics views in `023` are read-only derivations; recalc logic lives in SQL, so no rebuild needed after a schema change that adds relevant columns.