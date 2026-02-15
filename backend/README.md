# Backend (Legacy - Compatibility Layer)

> **DEPRECATED**: このディレクトリは移行期間の互換レイヤーです。
> 新規実装は `apps/backend` に追加してください。
> テスト・設定ファイル・スクリプトのみ残存しています。
> Phase 4 で物理削除予定です。

## 残存する役割

- `tests/`: 契約テスト・ユニットテストの実行基盤
- `scripts/`: Drizzle drift チェックスクリプト
- `package.json`: テスト実行用 scripts（`bun run test`, `bun run typecheck` 等）

## 禁止事項

- `backend/src/` への新規 TypeScript ファイル追加は禁止
- 新規機能の実装はすべて `apps/backend` または `apps/common` で行う
- 契約テスト（`app-layout-boundary.test.ts`）で自動検知される

## Schema/Migration workflow

DB 操作は引き続きルートコマンドから実行:

```bash
bun run db:drizzle:generate
bun run db:drizzle:migrate
bun run check:drizzle-drift
```
