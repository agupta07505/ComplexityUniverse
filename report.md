# ComplexityUniverse — Comprehensive Technical & Architectural Report

> **Project Name:** ComplexityUniverse  
> **Repository:** ComplexityUniverse With Aiven  
> **Core Purpose:** AI-Powered Time & Space Complexity Analysis Platform  
> **Stack:** Next.js 16 (App Router, Turbopack), React 19, Vanilla CSS Architecture, Aiven Cloud MySQL (SSL/TLS, Foreign Keys, Triggers, Views, and Virtual Generated Columns), and Google Gemini API.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack & Design Choices](#3-technology-stack--design-choices)
4. [End-to-End Workflow: How Code Analysis Works](#4-end-to-end-workflow-how-code-analysis-works)
5. [Database Architecture & MySQL Deep Dive](#5-database-architecture--mysql-deep-dive)
   - [5.1 Database Schema & Tables](#51-database-schema--tables)
   - [5.2 Database Views (Aggregations & Analytics)](#52-database-views-aggregations--analytics)
   - [5.3 Database Triggers (Automation & Audit Trails)](#53-database-triggers-automation--audit-trails)
   - [5.4 Generated Columns & Indexes](#54-generated-columns--indexes)
6. [AI Integration & Prompt Engineering Studio](#6-ai-integration--prompt-engineering-studio)
7. [Authentication & Authorization Model](#7-authentication--authorization-model)
8. [API Route Catalog & Backend Endpoints](#8-api-route-catalog--backend-endpoints)
9. [Frontend Components & UI Design System](#9-frontend-components--ui-design-system)
10. [Database Connectivity: Aiven Cloud MySQL](#10-database-connectivity-aiven-cloud-mysql)
11. [Setup, Deployment & Testing Guide](#11-setup-deployment--testing-guide)
12. [Summary & Key Architectural Highlights](#12-summary--key-architectural-highlights)

---

## 1. Executive Summary

**ComplexityUniverse** is a developer platform designed to analyze, visualize, and explain the algorithmic efficiency (Time and Space Complexity in Big-O notation) of source code.

Instead of generic estimates, ComplexityUniverse provides:
- **Big-O Badging:** Worst-case, average-case, and best-case performance classifications (e.g., $O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, $O(n^2)$, $O(2^n)$).
- **Line-by-Line Cost Breakdown:** Identifying exact loops, recursion depths, and auxiliary memory structures.
- **Bottlenecks & Optimization Tips:** Clear, actionable suggestions to reduce algorithmic cost.
- **Interactive Learn Library:** Pre-seeded topics with runnable code examples explaining fundamental data structures and algorithmic paradigms.
- **Personal Developer Dashboard:** Preserved analysis history, saved topics, profile stats, and a complexity breakdown distribution.
- **Admin Studio:** Live AI prompt engineering with automated schema-level versioning, live Gemini model selection, and user management.

---

## 2. High-Level Architecture

The system is built as a unified full-stack Next.js 16 application adhering to modern App Router principles.

```
                      +---------------------------------------+
                      |               Client                  |
                      |  (Browser: React 19, Framer Motion,   |
                      |   HTML5 Canvas Starfield, Custom CSS) |
                      +-------------------+-------------------+
                                          |
                                HTTP REST Requests (JSON)
                                          |
                                          v
                      +---------------------------------------+
                      |         Next.js App Router            |
                      |     (Next.js 16 Server Runtime)       |
                      |                                       |
                      |  * /api/analyze                       |
                      |  * /api/analyses                      |
                      |  * /api/topics                        |
                      |  * /api/profile                       |
                      |  * /api/auth/*                        |
                      |  * /api/admin/*                       |
                      +----------+-----------------+----------+
                                 |                 |
                    Fetch Prompts |                 | REST API / JSON
                    & App Config  |                 | (responseMimeType)
                                 v                 v
                 +-------------------+  +-----------------------+
                 | Aiven Cloud MySQL |  |   Google Gemini AI    |
                 | (TLS/SSL Enforced)|  | (gemini-3.8-flash /   |
                 | * 9 Tables        |  |  gemini-2.5-pro /     |
                 | * 5 Views         |  |  gemini-2.0-flash)    |
                 | * 10 Triggers     |  +-----------------------+
                 +-------------------+
```

---

## 3. Technology Stack & Design Choices

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | **Next.js 16 (App Router & Turbopack)** | Full-stack JavaScript unification; asynchronous request APIs (`await cookies()`, `await params`), Turbopack build optimization, and serverless-ready API routes. |
| **Frontend / UI** | **React 19 & Framer Motion** | Smooth interactive state management, tab transitions, animated result banners, and dynamic accordions. |
| **Canvas Graphics** | **HTML5 Canvas 2D (`StarField.js`)** | Custom particle starfield animation in the Hero banner without heavyweight external 3D libraries. |
| **Styling Architecture** | **Vanilla CSS (`globals.css` + `ComponentName.css`)** | Zero external CSS runtime overhead (no Tailwind); strictly adheres to DRY principles with global design tokens in `globals.css` and dedicated component styling files. |
| **Database** | **Aiven Cloud MySQL 8 (InnoDB, utf8mb4)** | High-availability cloud relational database with TLS/SSL encryption (`ca.pem`), foreign key cascades, views for performance, and triggers for audit logging. Zero local database footprint required. |
| **AI Engine** | **Google Gemini API** | Real-time AI analysis powered exclusively by Google Gemini (`gemini-3.8-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`) with structured JSON enforcement (`responseMimeType: 'application/json'`). No offline or mock fallbacks. |
| **Security & Auth** | **JWT & bcryptjs** | Stateless JWT tokens stored in `httpOnly`, `SameSite: Lax` secure cookies; bcrypt password hashing with 10 salt rounds. | |

---

## 4. End-to-End Workflow: How Code Analysis Works

Below is the chronological step-by-step lifecycle of an analysis request:

```
[User Pastes Code] 
        │
        ▼
[Clicks "Analyze Code" or presses Ctrl/Cmd + Enter]
        │
        ▼
[HomeAnalyzer.js] sends POST to `/api/analyze` { code, language, mode }
        │
        ▼
[api/analyze/route.js] Validates input length (5 chars <= length <= 60 KB)
        │
        ▼
[lib/ai.js: analyzeCode()]
        ├── 1. Fetches API Key & active Model from `app_settings` in MySQL
        ├── 2. Fetches active Prompt Template from `analysis_prompts` in MySQL
        ├── 3. Injects values: {CODE}, {LANGUAGE}, {MODE}
        └── 4. Calls Google Gemini API (`generativelanguage.googleapis.com`)
                   with generationConfig.responseMimeType = "application/json"
        │
        ▼
[Gemini Returns Structured JSON]
        │
        ▼
[lib/ai.js: normaliseResult()]
        ├── Validates shape: time_complexity, space_complexity, breakdown, cases, bottlenecks, optimizations
        └── Attaches prompt_id and prompt_version (for reproducibility audit)
        │
        ▼
[HomeAnalyzer.js] receives response
        ├── Smoothly scrolls viewport to result view
        ├── Renders color-coded Big-O badges (O(1) Green, O(n) Blue, O(n²) Amber, O(2ⁿ) Red)
        └── Renders Line-by-line step breakdown, bottlenecks, and optimizations
        │
        ▼ (Optional)
[User Clicks "Save to dashboard"]
        │
        ▼
[POST /api/analyses] Inserts record into `code_analyses`
        │
        ▼
[MySQL Trigger fires: trg_analyses_after_insert]
        ├── Automatically increments `users.analysis_count`
        └── Writes event record to `activity_log`
```

---

## 5. Database Architecture & MySQL Deep Dive

ComplexityUniverse utilizes advanced relational database features without relying on stored procedures.

### 5.1 Database Schema & Tables

The system comprises 9 well-structured relational tables:

```
+------------------+         1:1         +------------------+
|      users       +--------------------+>  user_profiles   |
+--------+---------+                     +------------------+
         |
         | 1:N
         +--------------------+
         |                    |
         v                    v
+--------+---------+   +------+-----------+
|  code_analyses   |   | user_saved_topics|
+------------------+   +------+-----------+
                              |
                              | N:1
                              v
                       +------+-----------+         1:N         +------------------+
                       |complexity_topics +--------------------+>  topic_examples  |
                       +------------------+                     +------------------+
                                                                         
+------------------+   +------------------+   +------------------+
| analysis_prompts |   |   activity_log   |   |   app_settings   |
+------------------+   +------------------+   +------------------+
```

1. **`users`**:
   - Manages user accounts (`id`, `name`, `email`, `password_hash`, `role`, `status`, `analysis_count`, `last_login_at`).
   - Uses `ENUM('user', 'admin')` and `ENUM('active', 'suspended')`.
   - Includes unique index on `email`.
2. **`user_profiles`**:
   - `1:1` extension of the `users` table storing `headline`, `bio`, `location`, and `avatar_seed`.
   - Constrained by `FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE`.
3. **`analysis_prompts`**:
   - Stores prompt templates used by the AI engine.
   - Contains template text with placeholders (`{CODE}`, `{LANGUAGE}`, `{MODE}`), an active flag (`is_active`), and an automatic incremental `version` counter.
4. **`code_analyses`**:
   - Stores every code analysis saved by registered users.
   - Contains raw source code, complexity badges, JSON detailed breakdown, language, analysis engine, and prompt version reference.
   - Constrained by foreign key to `users` with `ON DELETE CASCADE`.
5. **`complexity_topics`**:
   - Educational content for the Learn library (`topic_name`, `slug`, `category`, `difficulty`, `time_complexity`, `space_complexity`, `notes_html`).
   - Features a `FULLTEXT` index across `(topic_name, summary, notes_html)` for search queries.
6. **`topic_examples`**:
   - Concrete, worked code examples attached to topics.
   - `1:N` relationship with `complexity_topics` with `ON DELETE CASCADE`.
7. **`user_saved_topics`**:
   - Many-to-many junction table recording user bookmarks for topics with personal notes.
   - Composite unique key on `(user_id, topic_id)` preventing duplicate bookmarks.
8. **`activity_log`**:
   - Immutable audit trail populated by database triggers tracking user registrations, saved analyses, deleted analyses, and topic bookmarks.
9. **`app_settings`**:
   - Key-value configuration store for runtime application settings (`gemini_api_key`, `gemini_model`). Admin-editable from the web UI.

---

### 5.2 Database Views (Aggregations & Analytics)

ComplexityUniverse creates 5 SQL Views to decouple data presentation from raw queries:

| View Name | Source Tables | Purpose |
|---|---|---|
| **`v_user_overview`** | `users`, `user_profiles`, `user_saved_topics` | Joins user identity with profile data, calculates total saved topics via subquery, and computes a dynamic rank via `CASE` (e.g. *Administrator*, *Power analyst*, *Regular analyst*, *Getting started*, *Newcomer*). |
| **`v_analysis_feed`** | `code_analyses`, `users` | Provides public/dashboard analysis records, joins author names, and computes a `cost_grade` (`excellent`, `good`, `heavy`, `severe`) based on Big-O notation. |
| **`v_topic_overview`** | `complexity_topics`, `topic_examples`, `user_saved_topics` | Produces Learn page summaries while dynamically computing child example counts and bookmark counts. |
| **`v_user_saved_topics`**| `user_saved_topics`, `complexity_topics` | Flat join enabling instant retrieval of a user's bookmarked topics with full topic metadata. |
| **`v_complexity_distribution`** | `code_analyses` | Groups saved analyses by `time_complexity`, aggregates frequencies, and groups them into performance buckets (`fast`, `moderate`, `slow`). |

---

### 5.3 Database Triggers (Automation & Audit Trails)

The system deploys 10 automated triggers ensuring data integrity and business logic execution directly inside MySQL:

1. **`trg_users_before_insert`**: Trims user name and normalizes email to lowercase.
2. **`trg_users_before_update`**: Enforces email lowercase and trimmed name on user updates.
3. **`trg_users_after_insert`**: Automatically creates a default `user_profiles` entry (generating an avatar seed via `MD5(email)`) and writes an entry to `activity_log`.
4. **`trg_analyses_after_insert`**: Increments `users.analysis_count` by 1 and records an `'analysis_saved'` event into `activity_log`.
5. **`trg_analyses_after_delete`**: Decrements `users.analysis_count` (with `CASE` floor at 0) and records an `'analysis_deleted'` event into `activity_log`.
6. **`trg_topics_before_insert`**: Auto-generates a URL-friendly `slug` from `topic_name` by replacing spaces and slashes with hyphens.
7. **`trg_topics_before_update`**: Regenerates the `slug` if cleared and updates `updated_at`.
8. **`trg_saved_after_insert`**: Writes a `'topic_saved'` action to `activity_log`.
9. **`trg_saved_after_delete`**: Writes a `'topic_unsaved'` action to `activity_log`.
10. **`trg_prompt_before_update`**: Automatically increments `version = version + 1` whenever an admin modifies the AI prompt, providing an audit trail.

---

### 5.4 Generated Columns & Indexes

- **Virtual Generated Column:** In `code_analyses`, the column `code_lines` is stored and computed automatically without application code intervention:
  ```sql
  code_lines INT UNSIGNED GENERATED ALWAYS AS
    (CHAR_LENGTH(code_text) - CHAR_LENGTH(REPLACE(code_text, '\n', '')) + 1) STORED
  ```
- **Indexes:**
  - Foreign key composite indexes (e.g., `(user_id, created_at)`).
  - Search indexes (`FULLTEXT(topic_name, summary, notes_html)`).
  - Categorization indexes (`idx_topics_category`, `idx_analyses_complexity`).

---

## 6. AI Integration & Prompt Engineering Studio

### Dynamic Database Prompts
Unlike typical applications with hardcoded system prompts, ComplexityUniverse treats AI prompts as dynamic, versioned database assets in `analysis_prompts`.

### Placeholder Substitution
When `/api/analyze` receives code, `lib/ai.js:buildPrompt()` compiles the prompt by replacing:
- `{CODE}`: The source code snippet.
- `{LANGUAGE}`: JavaScript, Python, C++, Go, Rust, Java, etc.
- `{MODE}`: `'detailed'` (loops, recursion, cases, optimizations) or `'short'` (concise explanation).

### Gemini API Integration
The system interacts directly with the Google Gemini REST endpoint:
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
- **JSON Enforcement:** Set via `generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }`.
- **Validation & Recovery:** `extractJson()` handles responses, whether returned with or without markdown code fences (` ```json `).
- **Error Handling:** Recognizes 400 (invalid API key), 429 (rate limits), and 502 (invalid AI response), presenting clear human-friendly error messages in the UI.

---

## 7. Authentication & Authorization Model

```
[Client Request with Cookie 'cu_token']
                   │
                   ▼
       [lib/auth.js: verifyToken()]
                   │
         ┌─────────┴─────────┐
         │ Valid JWT Payload │
         ▼                   ▼
[getSessionUser()]     [requireUser()] ──> (Throws 401 if missing)
         │                   │
         └─────────┬─────────┘
                   ▼
            [requireAdmin()] ──> (Throws 403 if role !== 'admin')
```

- **Tokens & Passwords:** Uses signed JWTs (`JWT_SECRET`, default 7-day expiration). Passwords hashed using `bcrypt` (10 rounds).
- **Cookies:** Stored in an `httpOnly`, `sameSite: 'lax'`, `path: '/'` cookie named `cu_token`.
- **Role Hierarchy:**
  - **`user`**: Can analyze code, save analyses, browse topics, save topics, and update profile settings.
  - **`admin`**: Full user rights + access to `/admin` (configuring Gemini API key, updating system prompts, viewing global analytics, managing topics and user accounts).

---

## 8. API Route Catalog & Backend Endpoints

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/analyze` | Public | Analyzes code via Gemini AI and returns structured Big-O metadata. |
| `GET` | `/api/analyses` | User | Retrieves the signed-in user's saved analyses from `v_analysis_feed`. |
| `POST` | `/api/analyses` | User | Saves an analysis to the user's dashboard. |
| `GET` | `/api/topics` | Public | Lists published Learn topics and nested examples using `v_topic_overview`. |
| `GET` | `/api/profile` | User | Returns user profile, stats, rank, and line counts from `v_user_overview`. |
| `PUT` | `/api/profile` | User | Updates user name, headline, bio, and location. |
| `POST` | `/api/auth/login` | Public | Verifies credentials, updates `last_login_at`, and sets `cu_token` cookie. |
| `POST` | `/api/auth/register` | Public | Creates new user, triggers profile creation, and issues session cookie. |
| `POST` | `/api/auth/logout` | Public | Clears `cu_token` cookie. |
| `GET` | `/api/auth/me` | Public | Returns current session user or `null`. |
| `GET` | `/api/admin/stats` | Admin | Returns system totals, complexity distribution, and recent activity logs. |
| `GET` | `/api/admin/settings` | Admin | Reads current Gemini API key and active model from `app_settings`. |
| `PUT` | `/api/admin/settings` | Admin | Saves Gemini API key & model using `INSERT ... ON DUPLICATE KEY UPDATE`. |
| `GET` | `/api/admin/prompt` | Admin | Fetches active and historic AI analysis prompt templates. |
| `PUT` | `/api/admin/prompt` | Admin | Updates prompt template; triggers automatic version increment. |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/admin/topics` | Admin | Full CRUD management of Learn topics. |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/admin/examples` | Admin | Full CRUD management of topic code examples. |
| `GET`/`PUT` | `/api/admin/users` | Admin | User management (view status, toggle admin/user roles, suspend accounts). |

---

## 9. Frontend Components & UI Design System

### Design Philosophy
- **Dark Space Theme:** Deep cosmos palette (`#070a13`, `#0f172a`, `#1e293b`) with glowing borders and high-contrast typography.
- **Glassmorphism:** Translucent floating cards with subtle backdrop blurs.
- **DRY & Component-Scoped CSS Architecture:** Shared design tokens and utilities reside in `app/globals.css` (e.g. `.cu-wrap`, `.cu-btn`, `.cu-card`, `.cu-badge`), while each component uses its own dedicated stylesheet (`HomeAnalyzer.css`, `DashboardView.css`, `LearnView.css`, `ComplexityBadge.css`, `AnalysisResult.css`, `CodeBlock.css`, `Header.css`, `Footer.css`) with clean, descriptive class names.
- **Visual Performance Badges:**
  - `O(1)`, `O(log n)`: **Green** (Constant / Logarithmic - Optimal)
  - `O(n)`, `O(n log n)`: **Blue** (Linear / Linearithmic - Good)
  - `O(n²)`, `O(n³)`: **Amber** (Quadratic / Polynomial - Heavy)
  - `O(2ⁿ)`, `O(n!)`: **Red** (Exponential / Factorial - Severe)

### Key Components & Style Organization

- **`HomeAnalyzer.js` (`HomeAnalyzer.css`)**: Core analyzer interface. Includes quick-load sample algorithms, language picker, detailed/short toggle, and keyboard shortcut handler (`Ctrl/Cmd + Enter`).
- **`StarField.js` (`StarField.css`)**: Lightweight HTML5 Canvas particle generator drawing moving stars with twinkle effects.
- **`AnalysisResult.js` (`AnalysisResult.css`)**: Displays the returned JSON from Gemini, breaking it into Big-O summary badges, loop analysis breakdown table, best/average/worst cases, bottlenecks, and optimizations.
- **`LearnView.js` (`LearnView.css`)**: Two-pane browser with category filtering, search input, rendered markdown/HTML notes, and code snippet previews with bookmarking.
- **`DashboardView.js` (`DashboardView.css`)**: User overview banner showing rank badge, line count counters, complexity distribution graph, bookmarked topics, and saved analysis history.
- **`Header.js` (`Header.css`) & `Footer.js` (`Footer.css`)**: Navigation and session management.

---

## 10. Database Connectivity: Aiven Cloud MySQL

ComplexityUniverse is configured exclusively for **Aiven Cloud MySQL**:

### Cloud Setup (Aiven MySQL)
- **Automatic SSL/TLS**: Enforced with certificate verification using the provided `ca.pem` certificate authority.
- **Custom Port**: Accommodates Aiven's custom assigned ports (e.g., `10275`).
- **Resilience**: Uses a connection pool with keep-alive, auto-reconnect, and connection limits.
- **Zero Local Footprint**: No local MySQL installation, XAMPP, WAMP, or local database service is required.

---

## 11. Setup, Deployment & Testing Guide

### Prerequisites
1. **Node.js** >= 18.17.0 (built for Next.js 16 & React 19)
2. **Aiven Cloud MySQL Service** (configured in `.env.local` with SSL `ca.pem`)
3. **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/apikey))

### One-Click Bootstrap
```bash
# Windows
setup.bat

# Linux / macOS
chmod +x setup.sh && ./setup.sh
```

### Manual CLI Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure .env.local with Aiven MySQL credentials
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true, DB_CA_CERT=./ca.pem

# 3. Bootstrap database (creates tables, views, triggers, and demo users on Aiven)
npm run db:setup

# 4. Start local development server with Next.js 16 Turbopack
npm run dev
```

### Initial Configuration & Demo Accounts
1. Open `http://localhost:3000`.
2. Sign in as Admin:
   - **Email:** `admin@complexityuniverse.dev`
   - **Password:** `admin123`
3. Navigate to **Admin Console -> AI Settings**.
4. Paste your **Gemini API Key**, select model `gemini-3.8-flash` (or `gemini-2.5-pro` / `gemini-2.0-flash`), and click **Save API Settings**.
5. Return to the Home page and analyze any code snippet.

*(A standard user demo account is also seeded: `demo@complexityuniverse.dev` / `demo1234`)*.

---

## 12. Summary & Key Architectural Highlights

1. **Zero Hardcoded Prompts:** AI prompts live in Aiven MySQL with trigger-enforced version audits.
2. **Exclusive Real-Time Gemini AI Engine:** 100% of code analyses run directly through Google Gemini API (`v1beta`) with structured JSON schema enforcement (`responseMimeType: 'application/json'`). There is no offline or simulated fallback.
3. **Next.js 16 & React 19 Core:** Modern App Router architecture utilizing asynchronous request primitives, Turbopack, and React 19 hooks.
4. **Schema-Enforced Business Logic:** Uses 10 MySQL triggers to automate activity logging, user profile creation, and counters.
5. **High-Performance SQL Views:** Dashboard metrics and feed items are served through 5 specialized SQL views.
6. **DRY Component Styling:** Clean separation of concerns with component-specific CSS files (`ComponentName.css`) and centralized design tokens in `globals.css`. Zero CSS framework bloat.
