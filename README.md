# ComplexityUniverse

**Understand what your code costs.** Paste code, get a detailed time & space complexity
analysis from **Google Gemini**, learn algorithm complexity from a structured library, and
keep everything in your personal dashboard.

Built with **Next.js (App Router, JavaScript)**, **plain CSS files** (no Tailwind) and
**MySQL** (foreign keys, cascade, views, triggers — no stored procedures).

---

## Database — local MySQL or Aiven (online)

The site works with a local MySQL/XAMPP install **or** an online MySQL like
**Aiven**. The connection is configured in `.env.local`.

### Using Aiven (online MySQL)

1. Create a MySQL service in the [Aiven console](https://console.aiven.io)
2. Open the service → **Connection information** and copy **Host, Port, User, Password**
3. Edit `.env.local` and replace the MySQL block:

```
DB_HOST=mysql-12345.aivencloud.com
DB_PORT=17xxx              # Aiven uses a custom port — copy it exactly
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password
DB_NAME=defaultdb
DB_SSL=true                # or leave empty — SSL turns on automatically for remote hosts
# DB_CA_CERT=              # optional: paste Aiven's PEM certificate (or path to ca.pem)
```

4. Run the setup: `npm run setup` (or `setup.bat` / `setup.sh`)

That's it — `npm run setup` creates the `complexity_universe` database, all tables,
views, triggers and seed data **inside your Aiven service**. SSL/TLS is enabled
automatically for remote hosts (Aiven requires it).

> Tip: `DB_CA_CERT` is optional. Without it the connection is still encrypted, only the
> server certificate is not checked. Paste Aiven's CA certificate (PEM text) for full
> verification.

### Using local MySQL / XAMPP

Keep the default values in `.env.local` (`127.0.0.1:3306`, user `cu_app`) and make sure
MySQL is running (XAMPP/WAMP/Laragon: press *Start* next to MySQL) before you run the
setup and while using the site. The setup script creates the `cu_app` user automatically
(through the default `root` account) if it does not exist.

### What the setup creates automatically

1. `.env.local` (default settings) if it does not exist
2. A MySQL user `cu_app` if it does not exist (tries the default `root` account to create it)
3. The `complexity_universe` database — tables, foreign keys, cascade rules, views, triggers
4. Seed data — 15 Learn topics, 11 code examples, the AI prompt, demo users

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

Analysis is powered by **Google Gemini**. To set it up:

1. Get a free key at **https://aistudio.google.com/apikey**
2. Sign in as admin → open **Admin console → AI settings**
3. Paste the key, pick a model (`gemini-2.0-flash` recommended), press **Save API settings**

The key is stored in the MySQL table `app_settings` (updated with
`INSERT … ON DUPLICATE KEY UPDATE`), and the analysis prompt below it can be edited freely
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
styles/                # one css file per area (home, auth, learn, dashboard, admin, howto)
database/              # schema.sql + seed.sql
scripts/setup-db.mjs   # bootstrap: .env + MySQL user + schema + seed
```

## Design notes

- Plain CSS files with design tokens in `app/globals.css` — no CSS framework
- `framer-motion` for result/tab transitions, a tiny custom canvas starfield for the hero
- System font stacks only (renders identically offline)
