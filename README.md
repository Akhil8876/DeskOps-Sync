# Aria — AI E-Commerce Agent + Live Demo Store

A fully standalone AI commerce assistant **plus a working demo store** to test it on. Runs entirely on **local AI** — no external API dependencies, no data leaves your server, no per-token costs.

The app has three surfaces, all sharing one database:

| Route | What it is |
|---|---|
| `/` | **Storefront** — browse products, add to cart, checkout (creates real orders) |
| `/cart` | **Cart & checkout** — places a real order and decrements stock |
| `/admin` | **Admin dashboard + Aria** — live charts/tables next to the Aria chat |

## What Aria does

Aria understands natural language and can autonomously:
- Search, update, and manage products
- Process orders (status updates, refunds, tracking)
- Look up customers and their order history
- Send customer notifications
- Analyse store performance (revenue, top products, inventory)
- Create and manage discount codes
- Alert on low-stock items

## The demo loop 🎯

```
Shop at /  →  checkout  →  order + customer + stock change land in Postgres
                                        │
                                        ▼
Go to /admin  →  dashboard updates live  +  ask Aria about the order you just placed
```

Place an order, then ask Aria: *"Show me the most recent orders"*, *"Which products are low on stock?"*, or *"Mark order ORD-2026-0007 as shipped"* — it operates on the live data you just created.

## Quick start

> The `npm` steps are identical on every OS. Only the shell commands (copying
> `.env`, starting Postgres) differ — Windows variants are called out below.

### 1. Install Ollama (local AI — free, private, offline)

- **Windows / macOS:** download the installer from https://ollama.com/download
- **Linux:** `curl -fsSL https://ollama.com/install.sh | sh`

Then pull a model with strong tool-calling support (run this exact line — no trailing comment):

```
ollama pull qwen2.5:7b
```

### 2. Get a PostgreSQL database

Pick **one**:

- **Neon (easiest — no install, works everywhere incl. Windows):** create a free DB at
  https://neon.tech and copy its connection string. Skip Docker entirely.
- **Docker (macOS/Linux, or Windows with Docker Desktop):** `docker compose up -d`
- **Local Postgres install:** install PostgreSQL, then create an **empty** database (see the db:push note below).

### 3. Configure environment

Create a `.env` file (copy the example):

```bash
# macOS / Linux
cp .env.example .env
```
```bat
REM Windows (cmd)
copy .env.example .env
```

Then open `.env` and set `DATABASE_URL` to your database from step 2.
For Neon it looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

### 4. Install and run

```bash
npm install
npm run db:push     # create tables (see note below if this errors)
npm run dev         # http://localhost:5000
```

Demo data (12 products, 6 customers, 6 orders) is seeded automatically on first run. Open **http://localhost:5000** for the shop and **http://localhost:5000/admin** for the dashboard + Aria.

> **`db:push` error `column "id" is in a primary key`?** Your `DATABASE_URL`
> points at a database that already contains tables from something else, and
> Drizzle is trying to reconcile them. Point `DATABASE_URL` at a **fresh, empty
> database** (a new Neon project, or `CREATE DATABASE aria;`) and re-run
> `npm run db:push`. A clean database only runs `CREATE TABLE` statements.

---

## AI Provider options

Aria works with **any OpenAI-compatible endpoint** — swap provider by changing three env vars, no code changes needed.

| Provider | `AI_BASE_URL` | `AI_MODEL` | Cost |
|---|---|---|---|
| **Ollama (local)** | `http://localhost:11434/v1` | `qwen2.5:7b` | Free |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` | Free tier |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | Pay-per-use |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Llama-3-8b` | Pay-per-use |
| Mistral AI | `https://api.mistral.ai/v1` | `mistral-small-latest` | Pay-per-use |

### Recommended local models

| Model | Disk | VRAM | Tool calling |
|---|---|---|---|
| `qwen2.5:7b` | 4.7 GB | 6 GB | ⭐⭐⭐⭐⭐ |
| `llama3.1:8b` | 4.9 GB | 6 GB | ⭐⭐⭐⭐ |
| `qwen2.5:14b` | 9 GB | 10 GB | ⭐⭐⭐⭐⭐ Higher accuracy |

---

## Architecture

```
client/src/            React 19 + Vite + TailwindCSS
  ├─ pages/
  │   ├─ storefront.tsx   customer shop (product grid + category filter)
  │   ├─ cart.tsx         cart + checkout → places real orders
  │   └─ admin.tsx        dashboard + embedded Aria chat
  ├─ components/
  │   ├─ storefront/      ProductCard
  │   ├─ admin/           Dashboard (recharts) + AriaChatPanel
  │   └─ chat/            MessageBubble, ToolCallCard (shared by Aria)
  └─ hooks/
      ├─ useCart.ts       localStorage cart store
      └─ useAgentStream   SSE hook for real-time agent responses

server/
  ├─ agent/
  │   ├─ index.ts         agentic loop (streaming + tool use)
  │   ├─ tools.ts         14 e-commerce tools + executors
  │   └─ system-prompt    Aria's persona and behaviour rules
  ├─ routes.ts            REST API (storefront + checkout + agent + admin)
  └─ storage.ts           database layer incl. createOrderFromCheckout()

shared/
  └─ schema.ts            database schema shared between client and server
```

### Key endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/storefront/products` | Active catalog (optional `?category=`) |
| `POST` | `/api/storefront/checkout` | Place an order (upserts customer, decrements stock) |
| `POST` | `/api/agent/chat` | Aria streaming chat (SSE) |
| `GET` | `/api/analytics` | Dashboard stats, top products, orders-by-status |
| `GET` | `/api/orders` · `/api/products` | Admin tables |

## Embedding in another product

The agent exposes a single REST endpoint — easy to call from any frontend:

```bash
POST /api/agent/chat
Content-Type: application/json

{ "conversationId": 1, "message": "Show me all pending orders" }
```

The response is a Server-Sent Events stream. See `client/src/hooks/useAgentStream.ts` for a ready-made React hook.

## Available scripts

- `npm run dev` — development server with hot reload
- `npm run build` — production build
- `npm run db:push` — push schema changes to database
- `npm start` — run production build

## License

MIT
