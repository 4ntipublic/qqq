# AKPKYY Beat Market

Next.js App Router catalog + admin dashboard for a beat marketplace, backed by Supabase.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS + shadcn/ui
- Framer Motion
- Supabase (auth + Postgres + Storage)
- FFmpeg.wasm (client-side audio transcoding only)

## App Structure

- `app/layout.tsx` — root layout, metadata, font loading.
- `app/page.tsx` — home (renders `DashboardClient`).
- `app/beats/` — public beat catalog (grid + list view).
- `app/admin/` — admin dashboard: beats CRUD, categories, sales.
- `app/_components/` — shared cross-route components (BeatCard, providers, contexts).
- `components/ui/` — shadcn/ui primitives.
- `lib/` — server queries, FFmpeg transcoder, image → WebP helper, Supabase types.
- `utils/supabase/` — Supabase clients (browser, server, middleware, admin).
- `proxy.ts` — Next middleware (auth gating for `/admin/*`).
- `docs/CAVEATS.md` — non-obvious workarounds documented.

## Scripts

- `npm run dev` — start Next dev server.
- `npm run build` — production build.
- `npm run start` — production server.
- `npm run lint` — ESLint.

## Environment

- `.env.local` must define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Migrations

SQL files live in `lib/supabase/migrations/`. Apply via Supabase SQL editor in chronological order.
