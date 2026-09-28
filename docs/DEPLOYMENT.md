# Deployment guide — Render (backend) + Vercel (frontend)

Nothing here has been deployed yet. Follow the steps in order: the website reads the menu from the
backend while it is being built, so the backend must be live and filled with data first.

```
Browser ──► Vercel (Next.js, /api/* rewrite) ──► Render (FastAPI, Singapore) ──► Neon Postgres (Singapore)
```

The browser only ever talks to the Vercel address. Vercel forwards `/api/*` to Render, which keeps the
login cookie first-party ([ADR-0002](../history/adr/0002-auth-session-and-same-origin-proxy.md)).

---

## Environment variables (names only — never commit values)

### Backend on Render

| Name | Required | Value |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string of the production database |
| `DATABASE_URL_DIRECT` | yes | Neon **direct** connection string of the same database (used for migrations) |
| `JWT_SECRET` | yes | 32+ random characters (`render.yaml` makes Render generate it) |
| `FRONTEND_URL` | yes | The Vercel address, e.g. `https://your-app.vercel.app` (no trailing `/`). Comma-separate to allow a second address such as a custom domain |
| `COOKIE_SECURE` | yes | `true` |
| `TRUST_PROXY` | yes | `true` (so rate limits see the real visitor address) |
| `PYTHON_VERSION` | yes | `3.12.8` |
| `RATELIMIT_ENABLED` | optional | `true` (default) |
| `RATELIMIT_STORAGE_URI` | optional | `memory://` (default; one server instance) |
| `JWT_EXPIRE_DAYS` | optional | `7` |
| `FREE_DELIVERY_THRESHOLD` | optional | `1500` |
| `LOG_LEVEL` | optional | `info` |

Not needed on Render: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` and `TEST_DATABASE_URL`. The
admin is created once from your own computer (step 2), so the admin password never sits on a server.

### Frontend on Vercel

| Name | Required | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | The Render address, e.g. `https://kbg-backend.onrender.com` (no trailing `/`) |
| `NEXT_PUBLIC_SITE_URL` | yes | The public address of the site, e.g. `https://your-app.vercel.app` (used for share images, sitemap, robots) |

Neither is a secret. `NEXT_PUBLIC_API_URL` must be set **before** the first build.

---

## Step 0 — What you need

- GitHub with this repository pushed (the `main` branch has the whole project).
- Accounts on [Neon](https://neon.tech) (you have one), [Render](https://render.com) and [Vercel](https://vercel.com). Sign in to Render and Vercel with GitHub.
- On your computer: the `backend` folder set up as in `backend/README.md` (`uv sync` done).
- Decide the Vercel project name now, e.g. `karachi-burger-grill`. Its address will be
  `https://karachi-burger-grill.vercel.app` (Vercel tells you if the name is taken and adds a suffix).

## Step 1 — A clean production database on Neon

Your current database (`neondb`) holds test orders and test accounts. Use a fresh one:

1. Neon console → your project → **Branches** → `main` → **Databases** → **New database**.
2. Name it `kbg_production`, owner `neondb_owner`. Region stays Singapore.
3. Build the two production connection strings from the ones in `backend/.env`: keep everything the
   same but change the database name at the end from `/neondb` to `/kbg_production`.
   - pooled (host has `-pooler`) → `DATABASE_URL`
   - direct (no `-pooler`) → `DATABASE_URL_DIRECT`

## Step 2 — Create the tables, load the menu and create the admin (from your computer)

Open PowerShell in the `backend` folder. These values are set only for this window (they override
`.env`) and vanish when you close it:

```powershell
$env:DATABASE_URL        = "PASTE-PRODUCTION-POOLED-STRING"
$env:DATABASE_URL_DIRECT = "PASTE-PRODUCTION-DIRECT-STRING"
$env:ADMIN_EMAIL         = "the-restaurant-owners-email"
$env:ADMIN_PASSWORD      = "a-strong-password-of-12-or-more-characters"
$env:ADMIN_NAME          = "Restaurant Admin"

uv run python -m app.cli check-db       # confirm it answers
uv run alembic upgrade head             # create the tables
uv run python -m app.cli seed           # menu, delivery areas, sample reviews
uv run python -m app.cli create-admin   # the staff login for /admin
```

Keep the admin email and password somewhere safe (a password manager). Then close the window.

## Step 3 — Backend on Render

1. Render dashboard → **New +** → **Blueprint** → pick this repository → branch `main`.
   Render reads `render.yaml`: service `kbg-backend`, region **Singapore**, root `backend`, health
   check `/healthz`.
2. When it asks for the values marked "sync: false", enter:
   - `DATABASE_URL` and `DATABASE_URL_DIRECT` from step 1
   - `FRONTEND_URL` = `https://YOUR-VERCEL-NAME.vercel.app`
3. Click **Apply**. The first deploy takes a few minutes (it installs uv, then the packages).
4. When it says **Live**, open `https://kbg-backend.onrender.com/healthz`. You should see
   `{"status":"ok"}`. Also open `/api/v1/menu-items` to confirm the menu is there.
   (Your address may differ; copy it from the top of the service page.)
5. Plan: `render.yaml` uses **free**. A free service goes to sleep after 15 quiet minutes and the
   first visitor then waits about a minute. For a real restaurant switch it to **Starter** in
   Render → the service → Settings → Instance Type.

Every later `git push` to `main` redeploys automatically, and any new database migration is applied on
start.

## Step 4 — Frontend on Vercel

1. Vercel dashboard → **Add New… → Project** → import this repository.
2. **Root Directory**: click *Edit* and choose `frontend`. Framework preset: **Next.js** (detected).
   Leave the build and install commands as they are.
3. **Environment Variables** — add both, for Production (and Preview if you like):
   - `NEXT_PUBLIC_API_URL` = your Render address
   - `NEXT_PUBLIC_SITE_URL` = `https://YOUR-VERCEL-NAME.vercel.app`
4. Set the project name to the one from step 0, then click **Deploy**.
5. If the address Vercel gave you differs from the one you put in `FRONTEND_URL`, fix it: Render →
   `kbg-backend` → Environment → `FRONTEND_URL` → save (Render redeploys), and update
   `NEXT_PUBLIC_SITE_URL` on Vercel, then **Redeploy**.

## Step 5 — Check it works (10 minutes)

1. Open your Vercel address. The menu shows 33 items.
2. Add an item, check out as a guest (pick a scheduled time if it is closed), and place the order. You
   get a `KBG-` number.
3. Open `/admin/login` (in another browser or a private window) and sign in with the admin from step 2.
   The order is in the list. Move it to Preparing and watch the customer's tracker change.
4. Sign up as a customer, order, and open **My orders**.
5. Send a contact message and check `/admin/messages`.
6. Try the customer log-in with a wrong password 6 times in a row: the sixth attempt is blocked.

## After launch

- Real phone number, email and social links: `frontend/src/lib/data/site.ts`.
- **Custom domain**: add it in Vercel → Domains, then add it to Render's `FRONTEND_URL` (comma after the
  Vercel address) and set `NEXT_PUBLIC_SITE_URL` to it.
- Vercel **preview** deployments have other addresses, so their forms are refused by the backend's
  origin check. That is deliberate; only add an address to `FRONTEND_URL` if you trust it.
- Performance: measure the live site with PageSpeed Insights (see `docs/PROJECT-JOURNEY.md`).

## If something goes wrong

| Symptom | Likely cause and fix |
|---|---|
| Vercel build is slow (a few minutes) | The backend was asleep. The build waits for it to wake (up to three tries per request). If it never answers, the build still succeeds but the home, menu, cart, checkout, combos and favourites pages are then rendered on each visit instead of being pre-built. Fix `NEXT_PUBLIC_API_URL` if it was wrong and **Redeploy** once the backend answers |
| Forms say "This request is not allowed" | `FRONTEND_URL` on Render does not match the address in the browser exactly (including `https://`, no trailing `/`) |
| You sign in but are signed out on the next page | `COOKIE_SECURE` is `true` but the site is being opened over `http://`, or the browser is calling Render directly instead of `/api` on the Vercel address |
| Render says "Deploy failed" at start | `DATABASE_URL_DIRECT` is missing or wrong, so the migration step stops. Check the log |
| Menu is empty | Step 2 `seed` was run against a different database. Run it again with the production strings |
| Everyone shares one rate limit | `TRUST_PROXY` is not `true` on Render |
