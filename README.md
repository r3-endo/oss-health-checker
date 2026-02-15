# OSS Health Checker (MVP)

GitHub リポジトリの保守状態を最小シグナルで可視化する MVP です。

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

## Quality Gates

CI と同じ入口コマンドです。

```bash
bun run typecheck
bun run lint
bun run test
```

## Repository Layout

- `apps/backend`: API 実行アプリ
- `apps/batch`: 定期収集ジョブ実行アプリ
- `apps/frontend`: UI アプリ
- `apps/common`: 共有コード
- `db`: migration / drizzle artifacts など DB 資産
- `infra`: compose / env / scripts など運用資産の置き場

境界ルール:
- `apps/*` 同士の直接依存は禁止し、共有は `packages/*` 経由で参照する。
- `db` と `infra` は実行アプリとして扱わない。

## Note

- ルート直下の `backend/` は移行期間の互換レイヤーです。新規実装は `apps/*` に追加してください。
- Dockerfile / `compose.yml` の実装は別の OpenSpec change で扱います。

## MVP Constraints

- 認証なし単一インスタンス運用
- 登録可能なリポジトリは最大 3 件
- 判定ルールは固定:
  - `>= 6 months` commit stale
  - `>= 12 months` release stale
  - `open issues > 100`
- ステータスは `Active` / `Stale` / `Risky` の 3 段階
- 高度スコアリング、AI 要約、通知連携、マルチユーザー機能は対象外
