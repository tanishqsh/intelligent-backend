# intelligent-backend

## Table of Contents

-   [intelligent-backend](#intelligent-backend)
    -   [Table of Contents](#table-of-contents)
    -   [High-Level Overview](#high-level-overview)
    -   [Technology Stack](#technology-stack)
    -   [Runtime Flow](#runtime-flow)
    -   [Directory Walk-through](#directory-walk-through)
    -   [Key Modules \& Responsibilities](#key-modules--responsibilities)
        -   [Express API Layer](#express-api-layer)
        -   [Airstack \& Neynar Integrations](#airstack--neynar-integrations)
        -   [Firebase Persistence Layer](#firebase-persistence-layer)
        -   [BullMQ Job System](#bullmq-job-system)
        -   [Mimir Analytics Engine (PostgreSQL)](#mimir-analytics-engine-postgresql)
        -   [AlfaFrens Ecosystem Sync](#alfafrens-ecosystem-sync)
    -   [Data Lifecycle — "Sync Cast" Example](#data-lifecycle--sync-cast-example)
    -   [Environment Variables](#environment-variables)
    -   [Local Development](#local-development)
        -   [Contributing](#contributing)

---

## High-Level Overview

`intelligent-backend` powers **Farcaster-centric social analytics**. The service:

-   Ingests Farcaster casts, reactions, followers, etc. through the **Airstack** & **Neynar** APIs.
-   Persists raw entities & derived analytics to **Firebase Firestore**.
-   Performs interval-based aggregations (24 h, 7 d, 30 d, 180 d), ranking, and list generation inside a **PostgreSQL** data-mart codenamed **Mimir**.
-   Orchestrates IO-heavy tasks via **BullMQ** workers backed by **Redis**.
-   Supports gated routes secured by **Privy** auth tokens and a Firestore-driven whitelist.
-   Surfaces REST endpoints under `/api/**` for clients (web / mobile / cron).

<br/>

## Technology Stack

| Layer            | Library / Service        | Notes                                                 |
| ---------------- | ------------------------ | ----------------------------------------------------- |
| Web server       | **Express**              | Typed with TypeScript.                                |
| Task queues      | **BullMQ**               | Redis-backed job scheduling & workers.                |
| Persistent store | **Firebase Firestore**   | Raw casts, user documents, interval stats, etc.       |
| Analytics DW     | **PostgreSQL**           | Queried via `pg` in the _mimir_ module.               |
| Farcaster data   | **Airstack**, **Neynar** | GraphQL & REST endpoints.                             |
| Auth             | **Privy** JWT            | Middleware validates `Authorization: Bearer <token>`. |
| Cloud jobs       | **cron**                 | (Optional) recurring tasks, currently commented.      |

<br/>

## Runtime Flow

1. **Bootstrap** (`src/index.ts`)

    - Loads environment variables via `dotenv`.
    - Initializes Airstack (`initializeAirstack`) and Postgres pool (`initializeMimir`).
    - Registers Express middlewares (`json`, `urlencoded`, `cors`).
    - _Side-effect imports_ spin up BullMQ queues & workers at start-up (important: do **not** remove those imports).
    - Binds routers (root, `/api`, `/api/alfafrens`, `/api/user`, `/api/mimir`, `/api/degen`).

2. **Incoming Request** ➜ **Router**

    - Public endpoints: basic health checks, Farcaster cast analysis, reaction-fetch trigger, pagination helpers.
    - Protected endpoints:  
      `checkPrivyToken` middleware verifies Privy JWT, checks Firestore whitelist, kicks off **globalUserUpdateQueue**.

3. **Job Execution** (BullMQ workers)

    - Examples: `fetchRepliesFromCastWorker`, `fetchReactionsFromCastWorker`, `syncAlfaFrensWorker`, `intervalAggregationsWorker`, etc.
    - Workers fetch external data (Airstack, AlfaFrens, SQL) → transform → persist in Firestore.

4. **Analytics** (Mimir)
    - SQL files under `src/mimir/sql/**` implement heavy aggregations (followers delta, mention counts, etc.).
    - Jobs in `src/mimir/jobs/**` execute those queries for each user & timeframe, writing results back to Firestore so the client can consume without hitting Postgres directly.

<br/>

## Directory Walk-through

```
src/
├─ airstack/               # Airstack client bootstrap
├─ crons/                  # (Optional) cron-scheduled jobs
├─ db/                     # Firestore wrappers (add/fetch)
│   └─ ecosystem/alfafrens # AlfaFrens-specific collections
├─ ecosystems/             # One-off importers (e.g., completeAFSubs.ts)
├─ firebase/               # Firebase Admin SDK init (service account via env)
├─ middleware/             # Express middlewares (Privy auth, etc.)
├─ mimir/                  # Analytics engine (jobs, SQL, router)
│   ├─ jobs/               # BullMQ workers for analytics
│   ├─ router/             # `/api/mimir` Express routes
│   └─ sql/                # Parameterised SQL fragments
├─ neynar/                 # Neynar SDK client
├─ queues/                 # BullMQ queues & workers for Farcaster data
├─ routes/                 # Top-level API endpoints
├─ utils/                  # Shared helpers (Redis conn, Airstack GQL builders, etc.)
└─ index.ts                # Application entry point
```

<br/>

## Key Modules & Responsibilities

### Express API Layer

-   **`src/routes/index.ts`** – generic helpers: analyze URL, fetch replies/reactions, sync cast.
-   **`src/routes/alfafrens.ts`**, **`users.ts`**, **`degen.ts`** – domain-specific sub-routers.
-   **`checkPrivyToken.ts`** – ensures `Authorization` header is valid Privy JWT and caller FID is whitelisted.

### Airstack & Neynar Integrations

-   **Airstack**:  
    `getCastByUrlQuery`, `getRepliesByUrlQuery`, `getLikesByUrlQuery`, etc. build GraphQL; `fetchQueryWithPagination` streams paginated results.
-   **Neynar**:  
    Used mainly for quick cast lookup (`lookUpCastByHashOrWarpcastUrl`).

### Firebase Persistence Layer

-   Encapsulated in tiny helpers under `src/db/**` – e.g., `addCastToDB`, `addRepliesToDB`, `fetchRepliesFromDBUsingUrl`.
-   Firestore collections used:
    -   `casts`, `replies`, `reactions`
    -   `user_stats` (interval analytics)
    -   `whitelist` (FIDs allowed beyond auth)
    -   `based_games`, `ecosystems/*` (auxiliary)

### BullMQ Job System

-   **Queues** live in `src/queues/**`. Adding a job ➜ immediate worker execution in same process.
-   Redis connection parameters switch between _development_ & _production_ via env vars.
-   Worker logs prefix each operation for Cloudwatch / Logtail searching.

### Mimir Analytics Engine (PostgreSQL)

-   Connection pool created in `src/mimir/mimir.ts` (`initializeMimir`).
-   SQL fragments parameterised for reuse (`src/mimir/sql/**`).
-   Queue **`globalUserUpdateQueue`** orchestrates dozens of analytics sub-jobs per user, enforcing a 20-minute cooldown.

### AlfaFrens Ecosystem Sync

-   `syncAlfaFrensQueue` fetches user profile & channel subscribers via AlfaFrens public API.
-   Results stored in Firestore under `ecosystem/alfafrens/*` collections.

<br/>

## Data Lifecycle — "Sync Cast" Example

1. **Client** calls `GET /api/sync-cast?castUrl=<warpcast-url>` with a valid Privy token. 📲
2. **`checkPrivyToken`** validates token ➜ kicks off **globalUserUpdateQueue(fid)** for the caller.
3. Route executes Airstack `getCastByUrlQuery` to resolve the cast → persists in Firestore via `addCastToDB`.
4. Two jobs are queued:
    - `fetchRepliesFromCastQueue` (gathers every reply, pagination-aware).
    - `fetchReactionsFromCastQueue` (likes + recasts).
5. Workers ingest data, de-paginate via `fetchQueryWithPagination`, augment object (`reactionType`), then fire `addRepliesToDB` / `addReactionsToDB`.
6. UI can now call `/api/get-replies` (Firestore-backed) for instant hydration while deeper analytics run asynchronously in Mimir.

<br/>

## Environment Variables

| Variable                                                  | Purpose                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `PORT`                                                    | Express port (default 3000)                                           |
| `FIREBASE_SERVICE_ACCOUNT`                                | **Stringified** service-account JSON (see `src/firebase/firebase.ts`) |
| `AIRSTACK_API_KEY`                                        | Airstack API key                                                      |
| `NEYNAR_API_KEY`                                          | (Optional) Neynar key (demo fallback exists)                          |
| `PRIVY_APP_ID` / `PRIVY_APP_SECRET`                       | Privy production creds                                                |
| `PRIVY_DEV_APP_ID` / `PRIVY_DEV_APP_SECRET`               | Privy dev creds                                                       |
| `REDIS_DEVELOPMENT_HOST` / `REDIS_DEVELOPMENT_PASSWORD`   | Local Redis                                                           |
| `REDIS_PRODUCTION_HOST` / `REDIS_PRODUCTION_PASSWORD`     | Prod Redis                                                            |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT` | Postgres (Mimir)                                                      |

> Most secrets should be injected via your container/orchestrator — **never** commit them. See `.env.example` for a full list.

<br/>

## Local Development

1. **Clone & Install**

    ```bash
    git clone git@github.com:<you>/intelligent-backend.git
    cd intelligent-backend
    pnpm i   # or npm install / yarn
    ```

2. **Configure Secrets**

    - Copy `.env.example` → `.env` and fill values.
    - Export `FIREBASE_SERVICE_ACCOUNT` as _one line_ (e.g. `$(cat serviceAccount.json | jq -c)`).

3. **Start Services**

    ```bash
    # requires Redis & Postgres running locally or via Docker
    npm run dev
    ```

4. **Trigger Example**
    ```bash
    curl -X GET \
      -H "Authorization: Bearer <privy-jwt>" \
      "http://localhost:3000/api/sync-cast?castUrl=https://warpcast.com/~/cast/0x..."
    ```

Logs will show queue creation (`🚄 … SYNC QUEUE`) and worker processing in real time.

---

### Contributing

-   Use **TypeScript strict mode**; run `pnpm lint` before PRs.
-   Secrets **must** come from env; CI enforces `gitleaks` scan.
-   Long-running SQL lives under `src/mimir/sql`; keep business logic in jobs not routes.

---

Happy hacking 👋
