# Sixth Lens

Client photo gallery delivery app (Next.js App Router + Postgres + Cloudflare R2).

## Setup

1. **Install deps**: `npm install` (needs Node 18.17+, 20.3+, or 21+ — `sharp`'s
   native binary won't load on other versions, e.g. Node 19).
2. **Env vars**: copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — Postgres connection string (Supabase/Neon).
   - `AUTH_SECRET` — long random string (used to sign admin + gallery-PIN cookies).
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` — Cloudflare R2 credentials.
   - `R2_PUBLIC_HOSTNAME` — the bucket's public r2.dev subdomain or custom domain
     (used to serve `web/` and `thumb/` previews directly; `originals/` stay
     private and are only ever served via short-lived presigned URLs).
3. **Run the migration**: `npm run migrate` (applies `migrations/001_init.sql`).
4. **Create your photographer login** (there's no public signup — this is a
   single-photographer app):
   ```
   node scripts/create-photographer.js you@example.com 'a-strong-password' "Sixth Lens"
   ```
5. **Dev server**: `npm run dev`, then sign in at `/admin/login`.
6. **Your real logo**: replace `public/logo-black.png` and `public/logo-white.png`
   (currently placeholder marks) with your transparent-PNG logo files — same
   filenames, so no code changes are needed.

## Notes on deviations from a literal reading of the spec

- Added `password_hash` to `photographers` — required for the email/password
  admin login the spec asks for, which the given schema didn't have a column for.
- Added a small `gallery_views` table — needed to show "view counts" on the
  admin dashboard alongside favorites/downloads, which the given schema had no
  way to track.
- The rate limiter (`lib/rateLimit.ts`) is in-memory, scoped to one server
  process. Fine for a single instance; swap for Redis/Upstash if you deploy
  multiple instances or serverless with many cold starts.
- Bulk upload is one HTTP request per photo (concurrency-limited client-side
  queue, default 3 at a time), not R2's native multipart upload — simpler, and
  keeps server memory bounded to one photo at a time. True multipart would only
  matter for individual files above ~100s of MB, which isn't typical for a
  single photo.
- The client-facing masonry grid uses CSS multi-column (`column-width`) rather
  than CSS Grid, since Grid forces equal row heights and can't produce true
  variable-height masonry — `column-width` still scales continuously with
  viewport width, so column count is never breakpoint-based.
