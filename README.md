# ECBill Cloud — Admin Dashboard

Express + MongoDB Atlas backend, plus a React admin web app, deployed as a single
Render/Railway web service (the server serves the built web app's static files, so
there's only one service to deploy and no CORS setup needed between them).

## What this is for

Shop terminal apps sync their bills and expenses here. The admin web app lets you log
in and see sales records, profit & loss, and an overall summary across every shop, for
any date range up to 2 years back. Data older than 2 years is automatically deleted
every night (and can be triggered on demand from the Shops page) to keep the database
lean.

**Not included yet, deliberately:** per-shop live stock/inventory visibility. That
needs syncing the full product catalog, not just sales — a separate, meaningfully
different piece of work from this phase.

## 1. Set up MongoDB Atlas

1. Create a free account at mongodb.com/cloud/atlas, create a free (M0) cluster.
2. Database Access → add a database user with a password.
3. Network Access → add `0.0.0.0/0` (allow from anywhere) — Render's IPs aren't static,
   so this is the simplest option for a small deployment. If you want to lock it down
   later, Render's paid tiers support static outbound IPs.
4. Connect → Drivers → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
   Add a database name before the `?`, e.g. `.../ecbill?retryWrites=true...`

## 2. Deploy to Render

1. Push this `ecbill-cloud` folder to its own GitHub repo.
2. On Render: New → Web Service → connect that repo.
3. **Build Command:** `npm run install:all && npm run build`
4. **Start Command:** `npm start`
5. Environment variables (Render → Environment):
   - `MONGODB_URI` — the connection string from step 1
   - `JWT_SECRET` — any long random string. Generate one locally with:
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
6. Deploy. Render gives you a URL like `https://ecbill-cloud.onrender.com` — that's
   your Cloud API URL.

(Railway works the same way — same build/start commands, same two env vars.)

## 3. Create the first admin account

Visit your deployed URL. On the login screen, click "First time deploying this? Set
up the first admin account." This only works once — after one admin account exists,
that route stops working and you manage further admin accounts by creating them
directly in MongoDB Atlas for now (a proper "invite another admin" flow isn't built
yet, since this deployment is assumed to have one admin to start).

## 4. Register each shop and connect its terminal(s)

1. Log into the admin web app → Shops → note the Shop ID shown in the shop terminal's
   own Settings page (generated during that terminal's local Setup wizard).
2. Register the shop here using that *exact* Shop ID, so the terminal's existing local
   identity lines up with the cloud record instead of creating a mismatched second ID.
3. Copy the API key shown (only shown once).
4. In the shop terminal app: Settings → Sync → paste in the Cloud API URL (your Render
   URL) and the Shop API Key → Save Sync Settings → Sync Now.
5. Every terminal for the *same* shop uses the *same* Shop ID and API key — that's what
   lets multiple terminals in one shop report as a single combined shop in the
   dashboard without duplicating records.

## Local development

```bash
# Terminal 1
cd server && cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev

# Terminal 2
cd web
npm install
npm run dev
```

The web dev server proxies `/api` to `http://localhost:4000` (see `web/vite.config.js`),
so you don't need CORS configuration for local dev either.
