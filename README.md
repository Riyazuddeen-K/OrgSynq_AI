# OrgSynq AI

**OrgSynq AI** is a real-time HR workforce intelligence platform: employee
analytics, AI "digital twin" scoring, a workforce scenario simulator, an
interactive org network graph, an explainable AI insight feed, and a
Gemini-powered assistant — all backed by **Firebase Authentication +
Firestore (live `onSnapshot` listeners)**, with a light/dark theme.

Built with React + TypeScript + Vite + Tailwind CSS + Firebase + Recharts.

## Features

- **Authentication** — email/password sign-in and sign-up (Firebase Auth), route-protected app, working **sign out**, and a persisted profile in Firestore (`users/{uid}`)
- **Command Center** — org health, burnout index, flight risk, and department performance at a glance, with a 7-month health forecast — updates live as data changes
- **Employees** — searchable, filterable directory with grid/list views, add a new employee (writes to Firestore, auto-creates a starting digital twin), remove an employee, and CSV export
- **Digital Twins** — a 9-metric cognitive profile per employee (performance, skills, leadership, learning, burnout, attrition risk, promotion readiness, collaboration, org contribution)
- **Simulation Engine** — model Layoff, Hiring, Promotion, Budget Cut, Hybrid Work, Expansion, Restructuring, and Resignation scenarios; every run is saved to Firestore and streamed to every open session
- **Analytics Hub** — workforce composition, department health comparison, performance leaderboard, risk list, and a skills radar
- **Org Network** — an interactive SVG org chart built from each employee's manager, colored by department, with a detail side-panel
- **AI Decision Support** — a live feed of risk / opportunity / recommendation / prediction insights with confidence scores and step-by-step action plans you can mark resolved
- **Ask OrgSynq** — an in-app Gemini-powered chat assistant that can answer questions about your live workforce data
- **Command palette** (⌘K / Ctrl+K) for fast navigation and actions
- **Pulse survey widget**, live activity feed, and a working notifications dropdown
- **Settings** — theme, live Firebase connection status, deployment checklist
- **My Profile** — edit your display name and see your account details
- **Dark / light theme** toggle, persisted per device
- **Real-time everywhere** — employees, digital twins, insights, simulations, notifications, activity feed, pulse survey, departments, and the health trend all use Firestore `onSnapshot` listeners, so every open browser tab / device updates instantly when data changes — no refresh needed

## 1. Set up a Firebase project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** → **Add project** → name it (e.g. `orgsynq-ai`) → you can skip Google Analytics → **Create project**.
2. In the left sidebar, click **Build → Firestore Database** → **Create database** → start in **production mode** → pick a location → **Enable**.
3. In the left sidebar, click **Build → Authentication** → **Get started** → under **Sign-in method**, enable the **Email/Password** provider → **Save**. (This step is required — without it, sign-in/sign-up will fail with `auth/operation-not-allowed`.)
4. Register a web app: click the gear icon next to "Project Overview" → **Project settings** → scroll to **Your apps** → click the **`</>`** (web) icon → nickname it `orgsynq-ai-web` → **Register app**. You don't need Firebase Hosting.
5. You'll see a `firebaseConfig` object — keep this tab open, you'll need these values in step 3 below.

## 2. Set Firestore security rules

1. In Firestore Database, click the **Rules** tab.
2. Open `firebase/firestore.rules` from this project, copy its entire contents, paste it into the Rules editor (replacing what's there), and click **Publish**.

These rules require a signed-in user for every read/write, and restrict each `users/{uid}` profile document to its own owner. See the comment at the top of that file for how to add role-based (`admin` vs `employee`) restrictions later.

## 3. Run locally

```bash
npm install
```

Create a `.env` file in the project root (there's a `.env.example` you can copy: `cp .env.example .env`) and fill in **both** sections using the `firebaseConfig` values from step 1.5:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

# Optional — powers the "Ask OrgSynq" chat assistant. Get a free key at
# https://aistudio.google.com/app/apikey. The app works fine without it;
# the chat panel just won't have a live model to answer with.
VITE_GEMINI_API_KEY=...
```

(The `VITE_` versions are read by the browser app. The plain versions are read by the local seed script in step 4 — same values, just duplicated because Vite only exposes `VITE_`-prefixed vars to the browser bundle.)

`.env` is already listed in `.gitignore`, so your keys never get pushed to GitHub.

## 4. Seed sample data

```bash
npm run seed
```

This populates Firestore with 8 departments, 50 employees (with a realistic manager hierarchy), digital twins, sample AI insights, sample simulations, a 7-month health trend, and notifications. It's safe to re-run — it clears each collection first. Check it worked: Firebase Console → Firestore Database → Data tab → you should see an `employees` collection with 50 documents.

## 5. Start the app

```bash
npm run dev
```

Open `http://localhost:5173`. You'll land on the **sign-in page** — click "Don't have an account? Create one", enter any email/password (6+ characters) to create your first account, and you're in. Try opening the app in two browser tabs side by side and adding an employee in one — you'll see it appear instantly in the other, confirming real-time sync is working.

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: OrgSynq AI"
git branch -M main
git remote add origin https://github.com/<your-username>/orgsynq-ai.git
git push -u origin main
```

Your `.gitignore` already excludes `.env` and `node_modules`, so no secrets get pushed. Double check with `git status` before your first push that `.env` is **not** listed as a tracked file.

## 7. Deploy on Vercel (recommended)

1. Go to **[vercel.com/new](https://vercel.com/new)**, sign in with GitHub, and **Import** the `orgsynq-ai` repo.
2. Framework Preset: Vercel should auto-detect **Vite** — leave build settings as default (`npm run build`, output `dist`).
3. Before clicking Deploy, expand **Environment Variables** and add the six `VITE_FIREBASE_*` variables, plus `VITE_GEMINI_API_KEY` if you're using the chat assistant (the plain `FIREBASE_*` ones are only needed locally for `npm run seed`, not on Vercel).
4. Click **Deploy**. `vercel.json` is already included so client-side routing works on refresh/direct links.
5. Once deployed, go back to Firebase Console → Authentication → Settings → **Authorized domains** and add your new `*.vercel.app` domain (and any custom domain you attach), or sign-in will be blocked on the live site.

### Alternative: deploy on Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # select your existing project, public dir = dist, single-page app = yes
npm run build
firebase deploy --only hosting,firestore:rules
```

`firebase.json` and `firebase/firestore.indexes.json` are already included for this workflow.

## Project structure

```
orgsynq-ai/
├── firebase/
│   ├── firestore.rules       # security rules (paste into Firebase Console)
│   ├── firestore.indexes.json
│   └── seed.mjs               # sample data seed script (npm run seed)
├── firebase.json               # for `firebase deploy` via the CLI
├── src/
│   ├── components/            # Sidebar, Topbar, Layout, StatCard, charts, chat, modals, primitives
│   ├── context/                # AuthContext (sign-in/up/out), ThemeContext (light/dark)
│   ├── hooks/                   # real-time Firestore data hooks (employees, digital twins, insights…)
│   ├── lib/                      # firebase client, gemini client, shared types, utils
│   └── pages/                     # one file per route (incl. Login, Settings, My Profile)
├── .env.example
└── vercel.json
```

## Troubleshooting

- **"Demo mode" banner / no data loads**: your `.env` is missing or has empty values. Confirm all six `VITE_FIREBASE_*` vars are set and restart `npm run dev` (Vite only reads `.env` at startup).
- **Sign-in fails with `auth/operation-not-allowed`**: enable the Email/Password provider in Firebase Console → Authentication → Sign-in method (step 1.3 above).
- **Sign-in fails with `auth/unauthorized-domain` in production**: add your deployed domain under Authentication → Settings → Authorized domains.
- **Writes fail with `permission-denied`**: make sure you published `firebase/firestore.rules` (step 2) and that you're signed in.
- **Blank page after `npm run build` + `vercel deploy`**: confirm the six `VITE_FIREBASE_*` env vars are set in the Vercel project settings, not just locally.

## License

MIT — use this freely as a starting point for your own workforce intelligence tool.
