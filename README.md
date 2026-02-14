# OSS Health Checker (MVP)

GitHub リポジトリの保守状態を最小シグナルで可視化する MVP です。

## Prerequisites

- Bun `1.1.43` 以上
- Node.js `20+`（Bun 実行環境として）

## Setup（現行）

```bash
cd backend && bun install
cd ../frontend && bun install
```

## Run（現行）

```bash
# terminal 1
cd backend
bun run dev

# terminal 2
cd frontend
bunx --bun vite
```

Backend は `http://localhost:3000`、Frontend は `http://localhost:5173` を想定しています。

## Quality Gates

CI と同じ入口コマンドです。

```bash
cd backend
bun run format:check
bun run lint
bun run test

cd ../frontend
bun run format:check
bun run lint
bun run test
```

## レイアウト移行方針（OpenSpec: `separate-app-layout-from-dockerization`）

実装前提の新レイアウトは以下です。

- `apps/backend`
- `apps/batch`
- `apps/frontend`
- `packages/common`
- `db`
- `infra`

注意:
- この change ではレイアウト分離と依存境界の固定を扱います。
- Dockerfile / `compose.yml` は次の change で扱います（本 change の範囲外）。

## MVP Constraints

- 認証なし単一インスタンス運用
- 登録可能なリポジトリは最大 3 件
- 判定ルールは固定:
  - `>= 6 months` commit stale
  - `>= 12 months` release stale
  - `open issues > 100`
- ステータスは `Active` / `Stale` / `Risky` の 3 段階
- 高度スコアリング、AI 要約、通知連携、マルチユーザー機能は対象外
