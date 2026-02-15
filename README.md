# OSS Health Checker

## Prerequisites

- Bun `1.1.43` 以上
- Node.js `20+`（Bun 実行環境として）

## Setup

```bash
bun install
```

## Run

```bash
# Backend API (dev, http://localhost:3000)
bun run backend:dev

# Backend API (start)
bun run --filter oss-health-checker-api start

# Frontend UI (http://localhost:5173)
bun run frontend:dev

# Batch jobs (manual run)
bun run batch:snapshots
bun run batch:adoption
```

## Database / Migration

```bash
bun run db:drizzle:migrate
bun run db:drizzle:generate
bun run check:drizzle-drift
```

## CI Commands (Local Reproduction)

`backend-ci.yml` 相当:

```bash
bun install
bun run --filter oss-health-checker-api format:check
bun run backend:typecheck
bun run backend:lint
bun run backend:boundary-contract
bun run backend:test
bun run --filter oss-health-checker-api test:openapi-contract
bun run db:drizzle:migrate
bun run check:drizzle-drift
```

`frontend-ci.yml` 相当:

```bash
bun install
bun run frontend:typecheck
bun run frontend:lint
bun run frontend:test
```
