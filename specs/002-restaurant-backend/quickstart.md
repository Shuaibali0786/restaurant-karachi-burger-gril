# Quickstart: Restaurant Backend (Phase 2)

Run the full stack locally: backend on **:8000**, frontend on **:3000**.

## Prerequisites

- **Tools**:
  - Python 3.12+ and [uv](https://docs.astral.sh/uv/) (`uv --version`).
  - Node.js ≥ 20.9 (the frontend's existing requirement).
- **Neon project** in **Singapore** (`aws-ap-southeast-1`), with two branches:
  - `main`: development data.
  - `test`: used only by pytest.
- **Connection strings for each branch**:
  - the **pooled** string (host contains `-pooler`);
  - the **direct** string, used by migrations.

## 1. Backend setup

```bash
cd backend
uv sync                       # creates .venv from pyproject.toml + uv.lock
cp .env.example .env          # then fill in real values (never commit .env)
```

`backend/.env.example` (committed, placeholders only):

```dotenv
# Database (Neon, Singapore). Pooled URL for the app, direct URL for Alembic migrations.
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/kbg?sslmode=require
DATABASE_URL_DIRECT=postgresql+psycopg://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/kbg?sslmode=require
# Neon branch "test", used only by pytest. It must differ from DATABASE_URL.
TEST_DATABASE_URL=postgresql+psycopg://USER:PASSWORD@ep-yyyy-pooler.ap-southeast-1.aws.neon.tech/kbg?sslmode=require

# Auth
JWT_SECRET=replace-with-at-least-32-random-bytes    # python -c "import secrets;print(secrets.token_urlsafe(48))"
JWT_EXPIRE_DAYS=7
COOKIE_SECURE=true                                   # set false only if your browser rejects Secure cookies on http://localhost

# First admin (used once by `app.cli create-admin`)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password-of-12-plus-chars
ADMIN_NAME=Restaurant Admin

# Web
FRONTEND_URL=http://localhost:3000                   # CORS + Origin check; comma-separate for more than one
TRUST_PROXY=false                                    # true in production behind Vercel/Render
RATELIMIT_STORAGE_URI=memory://
RATELIMIT_ENABLED=true                               # false only for automated browser test runs
FREE_DELIVERY_THRESHOLD=1500
LOG_LEVEL=info
```

```bash
uv run alembic upgrade head              # create tables and the order_number_seq sequence
uv run python -m app.cli seed            # 8 categories, 33 items, promos, 6 areas, sample testimonials (safe to re-run)
uv run python -m app.cli create-admin    # admin from ADMIN_EMAIL / ADMIN_PASSWORD
uv run fastapi dev app/main.py --port 8000
```

Open <http://localhost:8000/docs> to check the interactive API docs, and
<http://localhost:8000/api/v1/healthz> for `{"status":"ok"}`.

## 2. Frontend setup

```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev                               # http://localhost:3000
```

Browser calls go to `http://localhost:3000/api/v1/...`, which the Next.js rewrite forwards to
`:8000`. The session cookie is therefore first-party.

## 3. Regenerate seed data and pricing fixtures (after changing frontend menu data or pricing)

```bash
cd frontend
npm run export:backend-data               # writes backend/app/seed/data/*.json and backend/tests/fixtures/pricing_golden.json
npm run export:backend-data -- --check    # CI/drift guard: fails if committed files are stale
```

## 4. Quality gates

```bash
# backend
cd backend
uv run ruff check . && uv run ruff format --check .
uv run mypy app
uv run pytest                              # unit + parity + integration (uses TEST_DATABASE_URL)

# frontend
cd frontend
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e                           # needs the backend running and seeded
```

## 5. Manual acceptance walkthrough (maps to the spec's user stories)

1. **US2 Menu**: `/menu` looks identical to Phase 1. In `/admin/menu`, mark *Fire Wings* sold out.
   Within 60 s the card shows "Sold out", and the add button is disabled.
2. **US1 Order**: as a guest, add 2 burgers and check out to Clifton. The confirmation shows
   `KBG-10001` or later. Replay the request in `/docs` with a changed `unitPrice`: it is rejected
   as an unknown field. Change the clock in the tests (not by hand) for the Wednesday and closed
   cases.
3. **US4 Admin**: sign in at `/admin/login` and click "Enable sound". Place an order in another
   browser. Within 15 s a chime plays and the order is highlighted. Move it to Preparing.
4. **US3 Tracker**: the customer's `/order/KBG-…` tab shows Preparing within 15 s, without a
   reload. Opened in a private window, it hides the phone and address.
5. **US5 Accounts**: sign up with a phone number, order, open "My orders", and choose "Order
   again". Log out, then fail the login 5 times: the 6th attempt is blocked.
6. **US6 Areas/messages**: add the area "Bahadurabad" with a fee of Rs 200. Checkout lists it, and
   a small order charges Rs 200. Send the contact form: it appears in `/admin/messages`.
7. **US7 Reviews**: mark an order Delivered, then review it from "My orders". Approve it in
   `/admin/reviews`. After 3 approvals the home page shows the real reviews without the "Sample
   reviews" label.

## 6. Putting it online

See [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) (Render for the backend, Vercel for the website).
