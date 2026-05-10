# Knowledge Hub API

REST API for a knowledge-sharing platform built with NestJS. Manage users, articles, categories, and comments.
[Repository](https://github.com/AdrianKotlinski/nodejs-2026q1-knowledge-hub)

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.
- Docker & Docker Compose - [Download & Install Docker](https://docs.docker.com/get-started/get-docker/).

## Requirements

- Node.js >= 24.10.0

## Setup

```bash
git clone <repository-url>
cd nodejs-2026q1-knowledge-hub
cp .env.example .env
```
## Docker Hub

Image: [adriankotlinskiepam/knowledge-hub-api](https://hub.docker.com/r/adriankotlinskiepam/knowledge-hub-api)

```bash
# Pull docker image
docker pull adriankotlinskiepam/knowledge-hub-api:latest

# Run it                                               
docker run -p 4000:4000 --env-file .env adriankotlinskiepam/knowledge-hub-api:latest  

# Build docker image
docker build -t adriankotlinskiepam/knowledge-hub-api:latest .

# Push docker image to Docker hub
docker push adriankotlinskiepam/knowledge-hub-api:latest

# Security scan
docker scout cves adriankotlinskiepam/knowledge-hub-api:latest

```

## Running with Docker

The recommended way to run the full stack (app + PostgreSQL database).

```bash
# Build and start all services
docker-compose up --build

# Start in detached (background) mode
docker-compose up --build -d

# Start with Adminer DB browser UI at http://localhost:8080
docker-compose --profile debug up --build

# Stop all services
docker-compose down

# Stop and remove volumes (clears database data)
docker-compose down -v
```

App runs on **http://localhost:4000** once healthy.

## Running Locally (without Docker)

```bash
npm install

# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm start
```

App runs on **http://localhost:4000** by default (configurable via `PORT` in `.env`).

## Prisma

```bash
# Init
npx prisma init --datasource-provider postgresql

# Migration
npx prisma migrate dev --name init (or npm run db:migrate)

# Seed 
npx prisma db seed (or npm run db:seed)
```

## Swagger UI

Interactive API docs available at **http://localhost:4000/doc/** once the server is running.

Raw OpenAPI spec: http://localhost:4000/doc-json

## Endpoints

### Users `/user`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/user` | Get all users |
| GET | `/user/:id` | Get user by ID |
| POST | `/user` | Create user |
| PUT | `/user/:id` | Update password |
| DELETE | `/user/:id` | Delete user |

### Articles `/article`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/article` | Get all articles (supports `?status=`, `?categoryId=`, `?tag=`) |
| GET | `/article/:id` | Get article by ID |
| POST | `/article` | Create article |
| PUT | `/article/:id` | Update article |
| DELETE | `/article/:id` | Delete article |

### Categories `/category`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/category` | Get all categories |
| GET | `/category/:id` | Get category by ID |
| POST | `/category` | Create category |
| PUT | `/category/:id` | Update category |
| DELETE | `/category/:id` | Delete category |

### Comments `/comment`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/comment?articleId=` | Get comments for an article |
| POST | `/comment` | Create comment |
| DELETE | `/comment/:id` | Delete comment |

### Pagination & Sorting

All list endpoints support optional query params:

| Param | Description | Example |
|-------|-------------|---------|
| `page` | 1-based page number | `?page=1&limit=10` |
| `limit` | Items per page | `?page=1&limit=10` |
| `sortBy` | Field name to sort by | `?sortBy=createdAt` |
| `order` | `asc` or `desc` (default `asc`) | `?sortBy=createdAt&order=desc` |

When `page` and `limit` are provided, response shape is:
```json
{ "total": 42, "page": 1, "limit": 10, "data": [...] }
```

### AI Endpoints `/ai`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/articles/:id/summarize` | Summarize an article (`?maxLength=short\|medium\|detailed`) |
| POST | `/ai/articles/:id/translate` | Translate an article (`targetLanguage` required in body) |
| POST | `/ai/articles/:id/analyze` | Analyze an article (`task=review\|bugs\|optimize\|explain`) |
| POST | `/ai/generate` | Generic prompt with optional session context (`sessionId`) |
| GET | `/ai/usage` | Token usage stats per endpoint |
| GET | `/ai/diagnostics` | Latency and cache-hit metrics |

All AI routes require a valid JWT `Authorization: Bearer <token>` header. Requests are rate-limited to `AI_RATE_LIMIT_RPM` per minute per IP; the response includes a `Retry-After` header when the limit is exceeded.

## Testing

The app must be running before executing tests.

```bash
# Run base test suite
npm test

# Run a single suite
npm run test -- test/users.e2e.spec.ts

# Code quality
npm run lint
npm run format
```

---

## AI & RAG — Retrieval-Augmented Generation

The Knowledge Hub API includes a RAG layer that answers questions using article content stored in the database.

## AI / Gemini Setup

The AI endpoints require a Google Gemini API key.

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Open your `.env` file and set:

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.5-flash
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300
```

**Models used:**
- Generation: `gemini-2.5-flash` (configured via `GEMINI_MODEL`)
- Embeddings: `text-embedding-004` — 768-dimensional vectors (configured via `GEMINI_EMBEDDING_MODEL`)

### Vector database

[Qdrant](https://qdrant.tech) runs as a dedicated Docker container on port `6333`. Data is persisted in the `qdrant_data` Docker volume.

### Full startup flow

```bash
# 1. Clone and configure
git clone <repo-url>
cd nodejs-2026q1-knowledge-hub
cp .env.example .env
# Edit .env — set GEMINI_API_KEY; for Docker leave RAG_VECTOR_DB_URL=http://vectordb:6333

# 2. Start all services (db + vectordb + app)
docker compose up --build

# 3. Sign up and get a token
curl -X POST http://localhost:4000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"login":"admin","password":"admin123"}'

TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"admin","password":"admin123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# 4. Build the vector index from published articles
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"onlyPublished": true}'

# 5. Semantic search
curl -X POST http://localhost:4000/ai/rag/search \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query": "how to use TypeScript generics", "limit": 3}'

# 6. RAG chat
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"question": "What topics are covered in the knowledge base?"}'

# 7. Remove an article from the index
curl -X DELETE http://localhost:4000/ai/rag/index/articles/<article-uuid> \
  -H "Authorization: Bearer $TOKEN"
```

### RAG endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/rag/index` | Build or refresh vector index from articles |
| POST | `/ai/rag/search` | Semantic search — returns ranked chunks with article attribution |
| POST | `/ai/rag/chat` | RAG chat — grounded answer + sources + conversation memory |
| DELETE | `/ai/rag/index/articles/:id` | Remove article vectors from index |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Required. Google AI Studio API key |
| `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` | Embedding model |
| `RAG_VECTOR_DB_URL` | `http://localhost:6333` | Qdrant URL (`http://vectordb:6333` in Docker) |
| `RAG_VECTOR_COLLECTION` | `knowledge_hub_articles` | Qdrant collection name |
| `RAG_CHUNK_SIZE` | `800` | Characters per chunk |
| `RAG_CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `RAG_CONVERSATION_MAX_MESSAGES` | `20` | Max messages kept per conversation |

### Known limitations

- **Free-tier quota**: Gemini free tier allows ~1500 embedding requests/day and ~15 RPM. Indexing many articles may hit the rate limit — wait and retry.
- **Embedding latency**: Each chunk requires a separate Gemini API call. Indexing 3 articles (~10 chunks) takes ~10–20 seconds.
- **Regional availability**: Gemini API may be unavailable in some regions. Use a VPN or a project with billing enabled if needed.
- **In-memory conversation history**: Conversations are stored in memory and lost on app restart.
