# Aria — AI E-Commerce Operations Agent

A fully standalone AI assistant for e-commerce operations. Runs entirely on **local AI** — no external API dependencies, no data leaves your server, no per-token costs.

## What it does

Aria understands natural language and can autonomously:
- Search, update, and manage products
- Process orders (status updates, refunds, tracking)
- Look up customers and their order history
- Send customer notifications
- Analyse store performance (revenue, top products, inventory)
- Create and manage discount codes
- Alert on low-stock items

## Quick start

### 1. Install Ollama (local AI — free, private, offline)

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model with strong tool-calling support
ollama pull qwen2.5:7b
```

### 2. Set up the database

```bash
# Using Docker
docker run -d --name aria-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL at minimum
```

### 4. Install and run

```bash
npm install
npm run db:push   # create tables
npm run dev       # http://localhost:5000
```

Demo data (12 products, 6 customers, 6 orders) is seeded automatically on first run.

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
client/                React 19 + Vite + TailwindCSS
  └─ ChatInterface      streaming chat UI with sidebar
  └─ useAgentStream     SSE hook for real-time responses

server/
  └─ agent/
      ├─ index.ts       agentic loop (streaming + tool use)
      ├─ tools.ts       14 e-commerce tools + executors
      └─ system-prompt  Aria's persona and behaviour rules
  └─ routes.ts          REST API
  └─ storage.ts         database layer (Drizzle ORM + PostgreSQL)

shared/
  └─ schema.ts          database schema shared between client and server
```

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
