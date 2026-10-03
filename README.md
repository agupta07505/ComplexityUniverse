# ComplexityUniverse

**Understand what your code costs.** Paste code, get a detailed time & space complexity
analysis from **Google Gemini**, learn algorithm complexity from a structured library, and
keep everything in your personal dashboard.

Built with **Next.js 16 (App Router, Turbopack, JavaScript)**, **React 19**, **Vanilla CSS Architecture** (`ComponentName.css` + `globals.css` design system, no Tailwind), and **Aiven Cloud MySQL** (foreign keys, cascade, views, triggers — no stored procedures, SSL/TLS encrypted).

---

## Database — Aiven MySQL (Cloud)

ComplexityUniverse is configured to run exclusively with **Aiven MySQL** with TLS/SSL encryption. The connection is configured in `.env.local`.

### Aiven MySQL Configuration

1. In your [Aiven Console](https://console.aiven.io), open your MySQL service → **Connection information**
2. Copy your **Host, Port, User, Password** into `.env.local`:

```
DB_HOST=complexity-universe-complexityuniverse.l.aivencloud.com
DB_PORT=10275
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password
DB_NAME=complexity_universe
DB_SSL=true
DB_CA_CERT=./ca.pem
```

3. Run the setup: `npm run setup` (or `npm run db:setup`)

`npm run db:setup` creates the `complexity_universe` database on Aiven, all tables, views, triggers, and seed data.

### What the setup creates in Aiven MySQL

1. The `complexity_universe` database — tables, foreign keys, cascade rules, views, and triggers
2. Seed data — 15 Learn topics, 11 code examples, the AI prompt template, and demo users

### Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@complexityuniverse.dev` | `admin123` |
| User | `demo@complexityuniverse.dev` | `demo1234` |

---

## Pages

| Route | What it does |
|---|---|
| `/` | Home — paste code in the center, **Analyze** button right below the textarea, detailed results beneath |
| `/learn` | Learn library — topics on the left, notes + worked code with analysis on the right, save any topic |
| `/dashboard` | User dashboard — saved code + analysis records, saved topics, profile info & stats |
| `/how-to-use` | How the site works, badge legend, FAQ |
| `/login`, `/register` | Authentication (the login page links straight to the admin console) |
| `/admin` | Admin console — topics & examples, **Gemini API key**, analysis prompt, users |

## Gemini API key (required for analysis)

Analysis is exclusively powered by **Google Gemini API** (there is no offline or mock fallback). To set it up:

1. Get an API key at **https://aistudio.google.com/apikey**
2. Sign in as admin → open **Admin console → AI settings**
3. Paste the key, pick a model (`gemini-3.8-flash` recommended), press **Save API settings**

The key is stored in the MySQL table `app_settings` (updated with
`INSERT … ON DUPLICATE KEY UPDATE`), or can optionally be specified in `.env.local` via `GEMINI_API_KEY`. The analysis prompt can be edited freely
(placeholders: `{CODE}`, `{LANGUAGE}`, `{MODE}`). Saving the prompt bumps its version via a
trigger.

## MySQL features used

- **Schema** — InnoDB, utf8mb4, primary/foreign keys, `ON DELETE CASCADE`, unique + fulltext
  indexes, a generated column (`code_analyses.code_lines`), ENUMs, `ALTER TABLE` steps
- **CRUD everywhere** — `INSERT`, `SELECT`, `UPDATE`, `DELETE` across all tables
- **Views** — `v_user_overview`, `v_analysis_feed`, `v_topic_overview`,
  `v_user_saved_topics`, `v_complexity_distribution` (with `CASE` grading)
- **Triggers** — email normalisation, auto profile creation on signup,
  `analysis_count` maintenance, slug generation, prompt version bumping, activity logging
- **Other statements** — `INSERT … ON DUPLICATE KEY UPDATE`, `INSERT IGNORE`,
  `UPDATE … CASE`, transactions (multi-statement safety)

No stored procedures are used.

## Project structure

```
setup.bat / setup.sh   # one-click project setup
run.bat / run.sh       # one-click start
app/                   # App Router pages + API routes (all .js)
  api/                 # auth, analyze, analyses, topics, profile, admin/*
  login|register|dashboard|learn|how-to-use|admin
components/            # Header, Footer, HomeAnalyzer, LearnView, DashboardView, ...
lib/                   # db pool, auth (JWT + bcrypt), Gemini AI service
database/              # schema.sql + seed.sql
scripts/setup-db.mjs   # bootstrap: .env + MySQL user + schema + seed
```

## Design & Styling Architecture

- **DRY & Component-Scoped**: Shared design tokens (`--ink-*`, `--accent-*`, `--cu-font-*`) and reusable components (`.cu-btn`, `.cu-card`, `.cu-wrap`, `.cu-badge`) live in `app/globals.css`.
- **Component Stylesheets**: Every component defines its focused styles in a dedicated file (`HomeAnalyzer.css`, `DashboardView.css`, `LearnView.css`, `ComplexityBadge.css`, `AnalysisResult.css`, `CodeBlock.css`, etc.) using clear, human-friendly class names.
- **Modern Animations**: `framer-motion` for smooth result/tab transitions, plus a lightweight custom HTML5 canvas starfield for the hero banner.
- **Zero CSS Bloat**: Pure vanilla CSS with zero Tailwind or runtime framework overhead, rendering crisp cosmic dark-theme UI across all modern browsers.
