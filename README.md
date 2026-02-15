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
# Backend API (http://localhost:3000)
bun run backend:dev

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
