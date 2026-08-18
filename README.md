# OrgSynq AI

**OrgSynq AI** is an HR workforce intelligence platform: employee analytics, AI "digital twin" scoring, a workforce scenario simulator, an interactive org network graph, and an explainable AI insight feed — all backed by **Firebase (Firestore)**, with a light/dark theme.

Built with React + TypeScript + Vite + Tailwind CSS + Firebase + Recharts.
Developed for Human Resource Management.

## Features

- **Command Center** — org health, burnout index, flight risk, and department performance at a glance, with a 7-month health forecast
- **Employees** — searchable, filterable directory with grid/list views, **add a new employee (writes to Firestore, auto-creates a starting digital twin)**, remove an employee, and CSV export
- **Digital Twins** — a 9-metric cognitive profile per employee (performance, skills, leadership, learning, burnout, attrition risk, promotion readiness, collaboration, org contribution)
- **Simulation Engine** — model Layoff, Hiring, Promotion, Budget Cut, Hybrid Work, Expansion, Restructuring, and Resignation scenarios and see projected productivity, financial, and morale impact; every run is saved to Firestore
- **Analytics Hub** — workforce composition, department health comparison, performance leaderboard, risk list, and a skills radar
- **Org Network** — an interactive SVG org chart built from each employee's manager, colored by department, with a detail side-panel
- **AI Decision Support** — a filterable feed of risk / opportunity / recommendation / prediction insights with confidence scores and step-by-step action plans you can mark resolved
- **Dark / light theme** toggle, persisted per device
- **Global search**, notifications dropdown with a working profile menu, and a settings page showing live Firebase connection status

## 1. Set up a Firebase project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** → **Add project** → name it (e.g. `orgsynq-ai`) → you can skip Google Analytics → **Create project**.
2. In the left sidebar, click **Build → Firestore Database** → **Create database** → start in **production mode** → pick a location → **Enable**.
3. Register a web app: click the gear icon next to "Project Overview" → **Project settings** → scroll to **Your apps** → click the **`</>`** (web) icon → nickname it `orgsynq-ai-web` → **Register app**. You don't need Firebase Hosting.
4. You'll see a `firebaseConfig` object — keep this tab open, you'll need these values in step 3 below.

## 2. Set Firestore security rules

1. In Firestore Database, click the **Rules** tab.
2. Open `firebase/firestore.rules` from this project, copy its entire contents, paste it into the Rules editor (replacing what's there), and click **Publish**.

This is a demo-friendly configuration: the app can read every collection and perform the specific writes it needs (add/remove employees, run simulations, resolve insights, mark notifications read). See the comment at the top of that file for how to tighten it with Firebase Authentication later.

## 3. Run locally

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in **both** sections using the `firebaseConfig` values from step 1.4:

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
```

(The `VITE_` versions are read by the browser app. The plain versions are read by the local seed script in step 4 — same values, just duplicated because Vite only exposes `VITE_`-prefixed vars to the browser bundle.)

## 4. Seed sample data

```bash
npm run seed
```

This populates Firestore with 8 departments, 50 employees (with a realistic manager hierarchy), digital twins, 6 sample AI insights, 2 sample simulations, a 7-month health trend, and notifications. It's safe to re-run — it clears each collection first. Check it worked: Firebase Console → Firestore Database → Data tab → you should see an `employees` collection with 50 documents.

## 5. Start the app

```bash
npm run dev
```

Open `http://localhost:5173`. You should see live data and no "Firebase isn't connected" banner. Try the **Add Employee** button on the Employees page to confirm writes work end-to-end.

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: OrgSynq AI"
git branch -M main
git remote add origin https://github.com/<your-username>/orgsynq-ai.git
git push -u origin main
```

Your `.gitignore` already excludes `.env` and `node_modules`, so no secrets get pushed.

## 7. Deploy on Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**, sign in with GitHub, and **Import** the `orgsynq-ai` repo.
2. Framework Preset: Vercel should auto-detect **Vite** — leave build settings as default (`npm run build`, output `dist`).
3. Before clicking Deploy, expand **Environment Variables** and add the six `VITE_FIREBASE_*` variables (the plain `FIREBASE_*` ones are only needed locally for `npm run seed`, not on Vercel).
4. Click **Deploy**. `vercel.json` is already included so client-side routing works on refresh/direct links.

## Project structure

```
orgsynq-ai/
├── firebase/
│   ├── firestore.rules       # security rules (paste into Firebase Console)
│   ├── firestore.indexes.json
│   └── seed.mjs               # sample data seed script (npm run seed)
├── firebase.json               # optional: for `firebase deploy` via the CLI
├── src/
│   ├── components/            # Sidebar, Topbar, Layout, StatCard, charts, primitives
│   ├── context/                # ThemeContext (light/dark)
│   ├── hooks/                   # Firestore data hooks (employees, digital twins, insights…)
│   ├── lib/                      # firebase client, shared types, utils
│   └── pages/                     # one file per route
├── .env.example
└── vercel.json
```

## Recommended next features

The app ships with a simple, open (no-login) data model on purpose. If you take this further, in rough priority order:

1. **Authentication & roles** — Firebase Authentication (email/password, Google sign-in, etc.) with `admin` / `manager` / `viewer` roles, and Firestore rules scoped to `request.auth.uid` so managers only see their own reports.
2. **Skills gap analysis** — a matrix comparing each employee's digital-twin skill scores against the skills a role requires, to power internal mobility and hiring plans.
3. **1:1 and goals tracking** — lightweight meeting notes and OKR/goal check-ins tied to each employee, feeding back into the performance score.
4. **PDF/export reports** — generate a shareable PDF snapshot of Command Center or an individual digital twin for leadership reviews.
5. **Audit log** — a collection recording every insight resolution, simulation run, and profile edit, for compliance.
6. **Real-time updates** — swap the one-time `getDocs` reads for Firestore's `onSnapshot` listeners so insights and notifications update live for every open session.
7. **Slack / email digest integration** — push critical insights and weekly summaries via a Firebase Cloud Function.
8. **Org chart drag-and-drop** — let admins reassign a manager directly from the Org Network graph.
9. **Model-backed predictions** — replace the deterministic simulation formulas with a trained model (e.g., via a Cloud Function calling an ML endpoint) for real predictive scoring.
10. **Multi-tenant support** — a `workspace_id` on every document so OrgSynq AI can serve more than one company from a single deployment.

## License

MIT — use this freely as a starting point for your own workforce intelligence tool.
