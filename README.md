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
