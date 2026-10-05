# ComplexityUniverse

**Understand what your code costs.** Paste any function or algorithm, receive a detailed time & space complexity analysis powered by **Google Gemini AI**, learn algorithm complexity from a structured reference library, and keep everything in your personal dashboard.

Built with **Next.js 16 (App Router · Turbopack · JavaScript)**, **React 19**, a **Vanilla CSS design system**, and **Aiven Cloud MySQL** — featuring foreign keys, cascade rules, views, triggers, generated columns, and SSL/TLS encryption.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Database Architecture](#database-architecture)
  - [Schema (Tables)](#schema-tables)
  - [Views](#views)
  - [Triggers](#triggers)
  - [MySQL Features Used](#mysql-features-used)
- [Google Gemini AI Integration](#google-gemini-ai-integration)
- [Pages & Routes](#pages--routes)
- [API Routes](#api-routes)
- [Components](#components)
- [Authentication & Authorization](#authentication--authorization)
- [Design & Styling Architecture](#design--styling-architecture)
- [Demo Accounts](#demo-accounts)
- [Documentation — DBMS Concepts Demonstrated](#documentation--dbms-concepts-demonstrated)
- [License](#license)

---

## Overview

ComplexityUniverse is a full-stack web application that helps developers understand the computational cost of their code. At its core, the platform:

1. **Analyzes code** — Users paste any code snippet and receive an AI-generated Big-O time and space complexity analysis with a line-by-line breakdown, best/average/worst case distinctions, identified bottlenecks, and concrete optimization suggestions.
2. **Teaches complexity** — A curated Learn library covers fundamental complexity classes, sorting algorithms, searching techniques, graph algorithms, and advanced topics — each with worked code examples and complexity annotations.
3. **Tracks progress** — Signed-in users save analyses and bookmark topics to a personal dashboard with lifetime statistics (total analyses, lines analyzed, most common complexity, efficiency ratio, and a rank system).

The application uses no offline or mock analysis fallback — every analysis is exclusively powered by **Google Gemini API** calls.

---

## Key Features

| Area | Details |
|---|---|
| **AI-Powered Analysis** | Detailed or short-mode analysis via Google Gemini; structured JSON response with time/space complexity, breakdown, cases, bottlenecks, optimizations, approach explanation, and confidence score |
| **Automatic Retries & Fallback Models** | If the primary Gemini model is rate-limited or overloaded, the system automatically retries and falls back through a list of alternative models |
| **Admin-Editable Prompt** | The analysis prompt template is stored in MySQL and can be rewritten from the Admin console; version is bumped automatically by a trigger |
| **Learn Library** | 15 seeded topics across categories (Fundamentals, Sorting, Searching, Graphs, Techniques) with difficulty levels, notes in HTML, and runnable code examples |
| **Personal Dashboard** | Three-tab view (Analyses, Saved Topics, Profile) with stats overview, expandable analysis details, activity timeline, and inline profile editing |
| **User Rank System** | MySQL view computes a rank label (Newcomer → Getting started → Regular analyst → Power analyst → Administrator) based on `analysis_count` |
| **Color-Coded Complexity Badges** | Green (O(1)/O(log n)), Blue (O(n)/O(n log n)), Amber (O(n²)/O(n³)), Red (O(2ⁿ)/O(n!)) — used across results, dashboard, and learn pages |
| **Cosmic Dark-Theme UI** | Canvas-rendered particle starfield with constellation network lines, cursor interactivity, and framer-motion animations |
| **Mobile-Responsive** | Hamburger menu, responsive grids, and touch-friendly interactions across all pages |
| **Admin Console** | Full CRUD for topics & examples, Gemini API key/model management, prompt editing, and user administration |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | 16.3.x |
| **UI Library** | React | 19.3.x |
| **Language** | JavaScript (ES Modules, no TypeScript) | — |
| **Database** | MySQL (Aiven Cloud) | 8.x |
| **DB Driver** | mysql2/promise (connection pool) | 3.11.x |
| **AI Engine** | Google Gemini API (REST) | v1beta |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | 9.x / 2.x |
| **Animations** | Framer Motion | 11.x |
| **Styling** | Vanilla CSS (design-token architecture) | — |
| **Runtime** | Node.js | ≥ 18.17.0 |

---

## Project Structure

```
ComplexityUniverse/
├── Setup/                         # One-click setup & run scripts
│   ├── setup.bat                  # Windows: install deps + bootstrap DB
│   ├── setup.sh                   # macOS/Linux: install deps + bootstrap DB
│   ├── run.bat                    # Windows: start dev server
│   └── run.sh                    # macOS/Linux: start dev server
│
├── app/                           # Next.js App Router (pages + API routes)
│   ├── layout.js                  # Root layout — Header, Footer, globals.css
│   ├── page.js                    # Home page — renders HomeAnalyzer
│   ├── globals.css                # Design system: tokens, reusable classes, responsive
│   │
│   ├── dashboard/page.js          # Server Component — fetches user data from MySQL views, renders DashboardView
│   ├── learn/page.js              # Learn library page
│   ├── login/page.js              # Login form
│   ├── register/page.js           # Registration form
│   ├── how-to-use/page.js         # How-to-use guide with step-by-step, badge legend, FAQ
│   ├── admin/page.js              # Admin console (topics, examples, AI settings, users)
│   │
│   └── api/                       # RESTful API routes
│       ├── analyze/route.js       # POST — send code to Gemini for analysis
│       ├── analyses/              # GET (list) + POST (save) user analyses
│       │   ├── route.js
│       │   └── [id]/route.js      # GET / DELETE a single analysis
│       ├── auth/
│       │   ├── login/route.js     # POST — authenticate, set JWT cookie
│       │   ├── register/route.js  # POST — create user (trigger creates profile + logs)
│       │   ├── logout/route.js    # POST — clear auth cookie
│       │   └── me/route.js        # GET — current session user
│       ├── profile/route.js       # GET / PUT — user profile
│       ├── topics/
│       │   ├── route.js           # GET — list published topics
│       │   └── [id]/
│       │       └── save/route.js  # POST — toggle bookmark (save/unsave)
│       └── admin/
│           ├── topics/route.js    # CRUD — manage Learn topics
│           ├── examples/route.js  # CRUD — manage topic code examples
│           ├── prompt/route.js    # GET / PUT — analysis prompt template
│           ├── settings/route.js  # GET / PUT — Gemini API key & model
│           ├── stats/route.js     # GET — admin dashboard statistics
│           └── users/route.js     # GET / PUT — user management
│
├── components/                    # React components (Client Components)
│   ├── Header.js / Header.css     # Site navigation with auth-aware menu
│   ├── Footer.js / Footer.css     # Four-column site footer
│   ├── HomeAnalyzer.js / .css     # Hero banner + code textarea + analysis trigger
│   ├── AnalysisResult.js / .css   # Full analysis result card with save-to-dashboard
│   ├── DashboardView.js / .css    # Three-tab dashboard (analyses, topics, profile)
│   ├── LearnView.js / .css        # Topic sidebar + notes/examples detail pane
│   ├── ComplexityBadge.js / .css   # Color-graded Big-O badge (green/blue/amber/red)
│   ├── CodeBlock.js / .css        # Monospace code display block
│   └── StarField.js / .css        # Canvas particle + constellation network animation
│
├── lib/                           # Server-side modules
│   ├── db.js                      # MySQL connection pool (cached on globalThis)
│   ├── mysql-config.mjs           # Reads .env.local, builds SSL config for Aiven
│   ├── auth.js                    # JWT sign/verify, bcrypt hash/compare, cookie mgmt
│   └── ai.js                      # Gemini API integration, prompt builder, retry logic
│
├── database/                      # SQL source files
│   ├── schema.sql                 # Full schema: 9 tables, 5 views, 10 triggers
│   └── seed.sql                   # Demo data: users, topics, examples, prompt, settings
│
├── scripts/
│   └── setup-db.mjs               # Bootstrap: creates DB + runs schema + seeds data
│
├── ca.pem                         # Aiven MySQL TLS/SSL certificate
├── .env.local                     # Environment variables (gitignored)
├── next.config.mjs                # Next.js config (strict mode, no X-Powered-By)
├── package.json                   # Dependencies & npm scripts
└── jsconfig.json                  # Path alias (@/ → project root)
```

---

## Prerequisites

- **Node.js** ≥ 18.17.0 (LTS recommended)
- **npm** (bundled with Node.js)
- **Aiven MySQL** service (or any MySQL 8+ instance with TLS support)
- **Google Gemini API key** (from [Google AI Studio](https://aistudio.google.com/apikey))

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# ── Aiven MySQL ──────────────────────────────────────────
DB_HOST=complexity-universe-complexityuniverse.l.aivencloud.com
DB_PORT=10275
DB_USER=avnadmin
DB_PASSWORD=your-aiven-password
DB_NAME=complexity_universe
DB_SSL=true
DB_CA_CERT=./ca.pem

# ── Authentication ───────────────────────────────────────
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# ── Google Gemini (optional — can also be set in Admin UI) ─
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
```

> **Note:** The Gemini API key can alternatively be configured from the Admin console → AI settings, where it is stored in the MySQL `app_settings` table. The database value takes precedence over the environment variable.

---

## Setup & Installation

### Option A: One-Click Scripts (recommended)

**Windows:**
```bash
Setup\setup.bat     # installs dependencies + bootstraps Aiven MySQL
Setup\run.bat       # starts the dev server on http://localhost:3000
```

**macOS / Linux:**
```bash
chmod +x Setup/setup.sh Setup/run.sh
./Setup/setup.sh    # installs dependencies + bootstraps Aiven MySQL
./Setup/run.sh      # starts the dev server on http://localhost:3000
```

### Option B: Manual

```bash
# 1. Install dependencies
npm install

# 2. Bootstrap database (schema + seed data)
npm run db:setup

# 3. Start development server (Turbopack)
npm run dev
```

The setup script (`scripts/setup-db.mjs`) performs the following:
1. Reads `.env.local` for Aiven MySQL connection details
2. Connects to the MySQL server with SSL/TLS using the `ca.pem` certificate
3. Creates the `complexity_universe` database if it doesn't exist
4. Executes `database/schema.sql` — creates all 9 tables, 5 views, and 10 triggers
5. Executes `database/seed.sql` — inserts demo users, 15 Learn topics, 11 code examples, the default analysis prompt, and app settings

### Available npm Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev -H 0.0.0.0` | Start dev server with Turbopack (accessible on LAN) |
| `build` | `next build` | Production build |
| `start` | `next start -H 0.0.0.0` | Start production server |
| `setup` | `npm install && node scripts/setup-db.mjs` | Full setup (deps + database) |
| `db:setup` | `node scripts/setup-db.mjs` | Database-only bootstrap |

---

## Running the Application

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. The development server uses Turbopack for fast refresh.

### First-Time Setup for Analysis

Analysis requires a valid Google Gemini API key:

1. Get an API key at **https://aistudio.google.com/apikey**
2. Sign in as admin (`admin@complexityuniverse.dev` / `admin123`)
3. Open **Admin console → AI settings**
4. Paste the key, select a model (`gemini-3.5-flash` recommended), press **Save API settings**

---

## Database Architecture

ComplexityUniverse uses **Aiven Cloud MySQL** with InnoDB, `utf8mb4_unicode_ci` charset, and TLS/SSL encryption. The connection pool is created once and cached on `globalThis` to prevent connection leaks during Next.js hot-reload.

### Schema (Tables)

The database consists of **9 tables** with carefully designed relationships:

```
┌───────────────────────────────────────────────────────────────────────┐
│                        complexity_universe                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐ 1:1  ┌────────────────┐                                │
│  │  users   │─────►│ user_profiles  │                                │
│  └──────┬───┘      └────────────────┘                                │
│         │                                                             │
│    1:N  ├──────────────────────────────┐                              │
│         │              1:N             │                              │
│         ▼                              ▼                              │
│  ┌──────────────┐         ┌───────────────────┐                      │
│  │code_analyses │         │user_saved_topics  │                      │
│  └──────────────┘         └────────┬──────────┘                      │
│                                    │ N:1                              │
│                                    ▼                                  │
│  ┌──────────────────┐    ┌───────────────────┐                       │
│  │ analysis_prompts │    │complexity_topics  │                       │
│  └──────────────────┘    └────────┬──────────┘                       │
│                                   │ 1:N                               │
│                                   ▼                                   │
│  ┌──────────────┐        ┌───────────────────┐                       │
│  │ app_settings │        │ topic_examples    │                       │
│  └──────────────┘        └───────────────────┘                       │
│                                                                       │
│  ┌──────────────┐                                                     │
│  │ activity_log │  (written by triggers on most INSERT/DELETE events) │
│  └──────────────┘                                                     │
└───────────────────────────────────────────────────────────────────────┘
```

| # | Table | Purpose | Key Columns |
|---|---|---|---|
| 1 | `users` | User accounts | `id`, `name`, `email`, `password_hash`, `role` (ENUM: user/admin), `status` (ENUM: active/suspended), `analysis_count`, `last_login_at` |
| 2 | `user_profiles` | Extended profile (1:1 with users, CASCADE delete) | `headline`, `bio`, `location`, `avatar_seed` |
| 3 | `analysis_prompts` | Admin-editable AI prompt templates (versioned by trigger) | `prompt_template` (MEDIUMTEXT), `is_active`, `version` (auto-incremented) |
| 4 | `code_analyses` | Every saved complexity analysis | `code_text`, `code_lines` (**generated column**), `time_complexity`, `space_complexity`, `summary`, `detailed_analysis` (JSON), `engine`, `prompt_version` |
| 5 | `complexity_topics` | Learn library content | `topic_name`, `slug` (auto-generated by trigger), `category`, `difficulty` (ENUM), `notes_html`, FULLTEXT index on `(topic_name, summary, notes_html)` |
| 6 | `topic_examples` | Runnable code + analysis per topic (CASCADE on topic) | `code_text`, `analysis_html`, `time_complexity`, `space_complexity` |
| 7 | `user_saved_topics` | Bookmarks from the Learn page (CASCADE on both user & topic) | `user_id`, `topic_id`, `note`, UNIQUE constraint on `(user_id, topic_id)` |
| 8 | `activity_log` | Audit trail (written by triggers) | `user_id`, `action`, `entity`, `entity_id`, `detail` |
| 9 | `app_settings` | Key-value store for site settings (Gemini key, model) | `setting_key` (PK), `setting_value` |

### Views

| View | Purpose | Notable SQL |
|---|---|---|
| `v_user_overview` | Dashboard identity card + rank label | `CASE` expression computes rank from `analysis_count`; LEFT JOIN to `user_profiles` |
| `v_analysis_feed` | Public feed of saved analyses with cost grading | `CASE` expression assigns `cost_grade` (excellent / good / heavy / severe) |
| `v_topic_overview` | Learn page topics with example & save counts | Correlated subqueries for `example_count` and `saved_count` |
| `v_user_saved_topics` | Saved-topic detail for the dashboard | JOIN `user_saved_topics` ↔ `complexity_topics` |
| `v_complexity_distribution` | Distribution of complexity classes | `GROUP BY time_complexity` with bucket classification (fast / moderate / slow) |

### Triggers

| Trigger | Event | What It Does |
|---|---|---|
| `trg_users_before_insert` | BEFORE INSERT on `users` | Normalises email (lowercase + trim) and trims name |
| `trg_users_after_insert` | AFTER INSERT on `users` | Creates a `user_profiles` row + writes to `activity_log` |
| `trg_users_before_update` | BEFORE UPDATE on `users` | Normalises email and name on edit |
| `trg_analyses_after_insert` | AFTER INSERT on `code_analyses` | Increments `users.analysis_count` + logs to `activity_log` |
| `trg_analyses_after_delete` | AFTER DELETE on `code_analyses` | Decrements `users.analysis_count` (with floor at 0) + logs to `activity_log` |
| `trg_topics_before_insert` | BEFORE INSERT on `complexity_topics` | Auto-generates `slug` from `topic_name` |
| `trg_topics_before_update` | BEFORE UPDATE on `complexity_topics` | Updates timestamp; regenerates slug if empty |
| `trg_saved_after_insert` | AFTER INSERT on `user_saved_topics` | Logs "topic_saved" to `activity_log` |
| `trg_saved_after_delete` | AFTER DELETE on `user_saved_topics` | Logs "topic_unsaved" to `activity_log` |
| `trg_prompt_before_update` | BEFORE UPDATE on `analysis_prompts` | Auto-increments `version` (audit trail for AI prompt changes) |

### MySQL Features Used

- **Schema** — InnoDB, utf8mb4, primary/foreign keys, `ON DELETE CASCADE`, unique + fulltext indexes, a generated column (`code_analyses.code_lines`), ENUMs, `ALTER TABLE` steps
- **CRUD everywhere** — `INSERT`, `SELECT`, `UPDATE`, `DELETE` across all tables
- **Views** — 5 views with `CASE` expressions, correlated subqueries, JOINs
- **Triggers** — 10 triggers for email normalisation, auto profile creation, counter maintenance, slug generation, prompt versioning, and activity logging
- **Other statements** — `INSERT … ON DUPLICATE KEY UPDATE`, `INSERT IGNORE`, `UPDATE … CASE`, transactions (multi-statement safety via `conn.beginTransaction()` / `conn.commit()` / `conn.rollback()`)
- **No stored procedures** are used

---

## Google Gemini AI Integration

The AI integration lives in `lib/ai.js` and handles the complete lifecycle of a code analysis:

### How Analysis Works

```
User pastes code
    │
    ▼
POST /api/analyze  (route validates input: 5 chars min, 60 KB max)
    │
    ▼
lib/ai.js → getAiSettings()  (reads API key + model from MySQL or .env)
    │
    ▼
lib/ai.js → getActivePrompt()  (fetches admin-editable prompt from DB)
    │
    ▼
lib/ai.js → buildPrompt()  (replaces {CODE}, {LANGUAGE}, {MODE} placeholders)
    │
    ▼
lib/ai.js → callGemini()  (sends request to Gemini API with retry + fallback)
    │
    ├─ Primary model → retry once on transient errors
    ├─ Fallback: gemini-3.5-flash
    ├─ Fallback: gemini-3.6-flash
    └─ Fallback: gemini-3.5-flash-lite
    │
    ▼
lib/ai.js → extractJson() + normaliseResult()
    │
    ▼
Structured JSON response returned to client
```

### Analysis Response Shape

```json
{
  "time_complexity": "O(n log n)",
  "space_complexity": "O(n)",
  "confidence": 0.95,
  "summary": "A one or two sentence human-readable summary",
  "approach": "What the code does and why the cost follows",
  "breakdown": [
    { "label": "outer loop", "detail": "iterates the array once", "cost": "O(n)" }
  ],
  "cases": { "best": "O(n)", "average": "O(n log n)", "worst": "O(n log n)" },
  "bottlenecks": ["the most expensive part of the code"],
  "optimizations": ["a concrete way to make it cheaper"],
  "notes": "any assumptions made",
  "engine": "gemini"
}
```

### Error Handling

The Gemini integration provides specific, actionable error messages for:
- Invalid API key (401/403) → directs user to Admin → AI settings
- Model not found (404) → suggests choosing an active model
- Quota exceeded (429) → advises waiting or switching models
- Server overload (503) → suggests retrying later
- Unparseable response (502) → suggests adjusting the prompt

---

## Pages & Routes

| Route | Type | What It Does |
|---|---|---|
| `/` | Client | **Home** — Hero banner with canvas starfield, code textarea, "Analyze complexity" button, and animated result display (cases, breakdown, bottlenecks, optimizations, approach). `Ctrl+Enter` shortcut supported |
| `/learn` | Server + Client | **Learn library** — Sidebar with topic categories on the left, selected topic's notes + worked code examples with complexity analysis on the right. Save/unsave topics |
| `/dashboard` | Server + Client | **User dashboard** — Server Component fetches data from MySQL views; renders a three-tab Client Component (Analyses with expand/delete, Saved Topics with open/remove, Profile with inline edit + activity timeline) |
| `/how-to-use` | Server | **How to use** — Step-by-step guide, color-coded badge legend, and FAQ section |
| `/login` | Client | **Sign in** — Email/password form; admin users see a link to the admin console |
| `/register` | Client | **Create account** — Name, email, password registration (trigger auto-creates profile) |
| `/admin` | Server + Client | **Admin console** — Tabbed interface: Topics & Examples CRUD, AI Settings (API key, model, prompt editor), User management |

---

## API Routes

### Public

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Send code for Gemini analysis (no auth required) |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT cookie |
| `POST` | `/api/auth/logout` | Clear JWT cookie |
| `GET` | `/api/auth/me` | Get current session user |

### User (requires authentication)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analyses` | List current user's saved analyses |
| `POST` | `/api/analyses` | Save an analysis to the dashboard |
| `GET` | `/api/analyses/[id]` | Get a single analysis by ID |
| `DELETE` | `/api/analyses/[id]` | Delete a saved analysis |
| `GET` | `/api/topics` | List published Learn topics |
| `POST` | `/api/topics/[id]/save` | Toggle bookmark (save/unsave a topic) |
| `GET` | `/api/profile` | Get current user's profile |
| `PUT` | `/api/profile` | Update profile (name, headline, bio, location) |

### Admin (requires admin role)

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/admin/topics` | CRUD for Learn topics |
| `GET/POST/PUT/DELETE` | `/api/admin/examples` | CRUD for topic code examples |
| `GET/PUT` | `/api/admin/prompt` | Read/update the analysis prompt template |
| `GET/PUT` | `/api/admin/settings` | Read/update Gemini API key & model |
| `GET` | `/api/admin/stats` | Admin dashboard statistics |
| `GET/PUT` | `/api/admin/users` | List & manage users (suspend/activate) |

---

## Components

| Component | File | Type | Description |
|---|---|---|---|
| **Header** | `Header.js` | Client | Global navigation bar with auth-aware menu items, mobile hamburger toggle, user avatar with initials, sign-out button, admin badge |
| **Footer** | `Footer.js` | Server | Four-column footer with brand info, navigation links, tech stack, and account links |
| **HomeAnalyzer** | `HomeAnalyzer.js` | Client | Main home page component: hero section with tagline, code textarea with line count, Analyze/Clear buttons, animated result container |
| **AnalysisResult** | `AnalysisResult.js` | Client | Renders a full analysis result card: complexity badges, color-coded orb, summary, cases table, cost breakdown list, approach explanation, bottlenecks, optimization ideas, analyzed code, save-to-dashboard button |
| **DashboardView** | `DashboardView.js` | Client | Three-tab dashboard: Analyses (expandable cards with delete), Saved Topics (with open/remove), Profile (table view + inline edit form + activity timeline) |
| **LearnView** | `LearnView.js` | Client | Split-pane Learn interface: scrollable topic sidebar with search, topic detail with notes HTML, and code examples with complexity badges and save-topic toggle |
| **ComplexityBadge** | `ComplexityBadge.js` | Client | Reusable badge that color-codes Big-O values: green (O(1), O(log n)), blue (O(n), O(n log n)), amber (O(n²), O(n³)), red (O(2ⁿ), O(n!)) |
| **CodeBlock** | `CodeBlock.js` | Client | Monospace code display with language label and copy functionality |
| **StarField** | `StarField.js` | Client | High-performance HTML5 canvas animation: glowing particles with constellation network lines between nearby nodes, cursor interactivity, and `prefers-reduced-motion` support |

---

## Authentication & Authorization

The auth system (`lib/auth.js`) implements a stateless JWT approach:

| Feature | Implementation |
|---|---|
| **Password Hashing** | `bcryptjs` with salt rounds = 10 |
| **Token** | JWT signed with `JWT_SECRET`, 7-day expiry |
| **Storage** | `httpOnly`, `sameSite: lax`, `secure` (in production) cookie named `cu_token` |
| **Session Check** | `getSessionUser()` — reads cookie → verifies JWT → queries `users` table |
| **Guards** | `requireUser()` (401 if not signed in), `requireAdmin()` (403 if not admin) |
| **Login Flow** | POST `/api/auth/login` → verify password → sign JWT → set cookie → update `last_login_at` |
| **Registration Flow** | POST `/api/auth/register` → hash password → INSERT user → trigger creates profile + activity log → sign JWT → set cookie |

---

## Design & Styling Architecture

### Design System

The styling architecture follows a **DRY, component-scoped** pattern with zero CSS framework overhead:

- **`app/globals.css`** — The design system file containing:
  - **Design tokens** — CSS custom properties (`--ink-*`, `--accent-*`, `--cu-font-*`, `--paper`, `--muted`)
  - **Reusable component classes** — `.cu-btn` (with variants: `cu-btn-primary`, `cu-btn-accent`, `cu-btn-ghost`, `cu-btn-danger`, `cu-btn-sm`, `cu-btn-lg`), `.cu-card`, `.cu-wrap`, `.cu-badge` (with variants: `cu-badge-accent`, `cu-badge-plain`), `.cu-input`, `.cu-textarea`, `.cu-table`, `.cu-grid-2/3/4`, `.cu-stat`, `.cu-field`, `.cu-label`, `.cu-eyebrow`, `.cu-display`, `.cu-hint`, `.cu-error-text`, `.cu-success-text`, `.cu-spin`
  - **Layout utilities** — `.cu-wrap` (max-width container), `.cu-page` (page-level padding), `.cu-section-head`
  - **Responsive breakpoints** — Mobile-first with breakpoints at standard widths

- **Component Stylesheets** — Each component has a dedicated `.css` file with focused, human-friendly class names:
  - `HomeAnalyzer.css` — Hero banner, analyzer card, code textarea, action bar
  - `DashboardView.css` — Dashboard hero, stats grid, tabs, card items, activity timeline
  - `LearnView.css` — Split-pane layout, topic sidebar, search, notes styling
  - `AnalysisResult.css` — Result header, complexity orb (animated glow), grid layout
  - `ComplexityBadge.css` — Color-graded badge variants (green/blue/amber/red)
  - `CodeBlock.css` — Monospace code container
  - `Header.css` — Navigation, brand logo, mobile toggle, user avatar
  - `Footer.css` — Footer grid, link columns
  - `StarField.css` — Canvas overlay positioning

### Visual Features

- **Cosmic Dark Theme** — Deep dark backgrounds with warm ink tones
- **Canvas Starfield** — GPU-accelerated particle animation with dynamic constellation network lines, cursor-reactive particle repulsion, and multi-color glowing nodes
- **Framer Motion Animations** — Smooth enter/exit transitions on analysis results, tab switches, and expandable details
- **Color-Coded Complexity Orb** — A pulsing, glowing orb that reflects the cost grade of the analysis
- **Zero CSS Bloat** — Pure vanilla CSS with no Tailwind or runtime CSS-in-JS overhead

---

## Demo Accounts

The seed data includes two pre-configured accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@complexityuniverse.dev` | `admin123` |
| User | `demo@complexityuniverse.dev` | `demo1234` |

The admin account provides access to the Admin console at `/admin`, where you can manage topics, examples, AI settings, the analysis prompt, and users.

---

## Documentation — DBMS Concepts Demonstrated

ComplexityUniverse was built as a **Database Management System (DBMS) course project** to demonstrate practical, real-world application of core DBMS concepts within a full-stack web application. The following concepts are exercised throughout the codebase:

### Core DBMS Concepts

| # | Concept | Where It's Used |
|---|---|---|
| 1 | **Database Creation** | `CREATE DATABASE complexity_universe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` |
| 2 | **Table Design (DDL)** | 9 tables created with `CREATE TABLE`, each using InnoDB engine |
| 3 | **Primary Keys** | Every table has a primary key (`id` or `setting_key`) |
| 4 | **Foreign Keys** | 8 foreign key constraints linking users → profiles, users → analyses, topics → examples, etc. |
| 5 | **Referential Integrity** | `ON DELETE CASCADE`, `ON UPDATE CASCADE` on all foreign keys — deleting a user removes all their analyses, profiles, saved topics, and activity logs |
| 6 | **Unique Constraints** | `uq_users_email`, `uq_profile_user`, `uq_topics_slug`, `uq_saved_user_topic` |
| 7 | **Indexes** | Regular indexes (`idx_*`), unique indexes, and a `FULLTEXT` index on `complexity_topics` for search |
| 8 | **ENUM Data Types** | `users.role` (user/admin), `users.status` (active/suspended), `complexity_topics.difficulty` (Beginner/Intermediate/Advanced), `code_analyses.detail_mode` (short/detailed) |
| 9 | **Generated (Computed) Columns** | `code_analyses.code_lines` — automatically computed from `code_text` using `CHAR_LENGTH` and `REPLACE` |
| 10 | **ALTER TABLE** | Schema evolution demonstrated: adding `last_login_at` and `status` columns to `users`, widening `summary` column in `complexity_topics` |

### CRUD Operations

| Operation | Examples |
|---|---|
| **INSERT** | User registration, saving analyses, bookmarking topics, admin creating topics/examples, `INSERT … ON DUPLICATE KEY UPDATE` for app settings |
| **SELECT** | Dashboard queries using views and subqueries, topic listing with joins, user profile lookups, admin statistics |
| **UPDATE** | Profile editing, admin user management (suspend/activate), AI settings update, prompt editing, `UPDATE … CASE` for counter maintenance |
| **DELETE** | Removing saved analyses, unsaving topics, admin deleting topics/examples |

### Views (5 Total)

| View | DBMS Concepts Shown |
|---|---|
| `v_user_overview` | `LEFT JOIN`, `CASE` expression for rank calculation, correlated subquery |
| `v_analysis_feed` | `JOIN`, `CASE` expression for cost grading |
| `v_topic_overview` | Correlated subqueries for aggregate counts |
| `v_user_saved_topics` | Multi-table `JOIN` |
| `v_complexity_distribution` | `GROUP BY`, `COUNT(*)`, `CASE` for bucket classification, `ORDER BY` |

### Triggers (10 Total)

| Trigger | DBMS Concepts Shown |
|---|---|
| `trg_users_before_insert` | `BEFORE INSERT`, data normalisation (`LOWER()`, `TRIM()`) |
| `trg_users_after_insert` | `AFTER INSERT`, automatic row creation in related table, audit logging |
| `trg_users_before_update` | `BEFORE UPDATE`, data validation on modification |
| `trg_analyses_after_insert` | `AFTER INSERT`, counter maintenance via `UPDATE` |
| `trg_analyses_after_delete` | `AFTER DELETE`, safe counter decrement with `CASE` (floor at 0) |
| `trg_topics_before_insert` | `BEFORE INSERT`, string transformation (`LOWER()`, `REPLACE()`, `TRIM()`) |
| `trg_topics_before_update` | `BEFORE UPDATE`, conditional logic (`IF` statement) |
| `trg_saved_after_insert` | `AFTER INSERT`, audit trail logging |
| `trg_saved_after_delete` | `AFTER DELETE`, audit trail logging |
| `trg_prompt_before_update` | `BEFORE UPDATE`, auto-increment versioning |

### Transactions

The application uses explicit transaction management in `lib/db.js`:
```javascript
await conn.beginTransaction();
// ... multiple statements ...
await conn.commit();
// on error:
await conn.rollback();
```
This ensures atomicity when multiple related operations must succeed or fail together.

### Additional SQL Features

- **Subqueries** — Used in dashboard stats (6 correlated subqueries in a single SELECT)
- **Aggregate Functions** — `COUNT(*)`, `SUM()`, `COALESCE()`
- **`INSERT … ON DUPLICATE KEY UPDATE`** — For upsert operations on app settings
- **`INSERT IGNORE`** — For idempotent seed data insertion
- **`GROUP BY` with `ORDER BY`** — For complexity distribution and most-common-complexity stats
- **`DISTINCT`** — For counting unique languages analyzed
- **`LIMIT`** — For pagination and top-N queries
- **Connection Pooling** — `mysql2/promise` pool cached on `globalThis` to prevent connection leaks
- **SSL/TLS Encryption** — Aiven MySQL connection uses `ca.pem` certificate for encrypted transport
- **Character Set** — `utf8mb4_unicode_ci` for full Unicode support

### What Is NOT Used (by design)

- **Stored Procedures** — Not used; all business logic lives in the application layer (Next.js API routes)
- **Cursors** — Not needed; all queries use set-based operations
- **User-Defined Functions** — Not used; MySQL built-in functions suffice

---

## License

This project is developed as an **academic project** for the **Database Management System (DBMS)** course. It is intended solely for **educational and evaluation purposes**.

- **Not for commercial use** — This project is not licensed for commercial distribution or deployment.
- **Not open source** — The source code is private and shared only for academic evaluation.
- **Academic integrity** — If you are a student, do not copy or submit this project as your own work. Use it as a reference to understand full-stack DBMS application design.

© 2026 ComplexityUniverse — DBMS Course Project. All rights reserved.
