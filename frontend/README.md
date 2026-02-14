# Frontend (Legacy - Migration Pending)

> **NOTE**: 実行入口は `apps/frontend` に統一されました。
> ルートコマンド `bun run frontend:dev` 等は `apps/frontend` 経由で本ディレクトリに委譲されます。
> 新規機能の追加は引き続き `frontend/src/features/` に実装しますが、
> 将来的に `apps/frontend` への移送を予定しています。

## Architecture

- Feature-based folder structure
- `app` = composition root / provider wiring
- `features` = feature-local API/model/hooks/ui
- `shared` = cross-feature reusable primitives only
- State management: jotai
- Server-state fetching: TanStack Query
- Validation: zod
- API boundary via repository API port + adapter

## Commands (via root)

```bash
bun run frontend:dev
bun run frontend:typecheck
bun run frontend:lint
bun run frontend:test
```
