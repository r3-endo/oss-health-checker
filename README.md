# OSS Health Checker (MVP)

GitHub リポジトリの保守状態を最小シグナルで可視化する MVP です。

## Prerequisites

- Bun `1.1.43` 以上
- Node.js `20+`（Bun 実行環境として）

## Setup

```bash
cd backend && bun install
cd ../frontend && bun install
```

## Run

```bash
# terminal 1
cd backend
bun run dev

# terminal 2
cd frontend
bunx --bun vite
```

Backend はデフォルトで `http://localhost:3000`、Frontend は `http://localhost:5173` を想定しています。

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

## MVP Constraints

- 認証なし単一インスタンス運用
- 登録可能なリポジトリは最大 3 件
- 判定ルールは固定:
  - `>= 6 months` commit stale
  - `>= 12 months` release stale
  - `open issues > 100`
- ステータスは `Active` / `Stale` / `Risky` の 3 段階
- 高度スコアリング、AI 要約、通知連携、マルチユーザー機能は対象外
