# Backend Diff Security Review (2026-02-10)

対象: 現在のワークツリー差分（Drizzle/SQLite 永続化実装）
重点観点: SQLインジェクション、レースコンディション、トランザクション/ロック

## Findings

### 2. Medium - 最新スナップショット取得で read skew が起こりうる

- 参照: `backend/src/infrastructure/repositories/drizzle-snapshot-adapter.ts:64`, `backend/src/infrastructure/repositories/drizzle-snapshot-adapter.ts:75`, `backend/src/infrastructure/repositories/drizzle-snapshot-adapter.ts:84`, `backend/src/infrastructure/repositories/drizzle-snapshot-adapter.ts:101`
- `snapshots` と `snapshot_warning_reasons` を別クエリで取得しており、並行更新時に整合しない読み取りが起こりうる。
- 読み取り側を transaction で包む、または JOIN/サブクエリで1クエリ化する方がレース耐性が高い。

### 3. Medium - SQLite ロック競合対策が未設定

- 参照: `backend/src/infrastructure/db/drizzle/client.ts:21`
- `foreign_keys = ON` はあるが、`busy_timeout` / `journal_mode=WAL` が未設定。
- 複数プロセスまたは高頻度書き込み時に `database is locked` が発生しやすい。

## SQL Injection 観点

- 差分内に、ユーザー入力を文字列連結でSQL化する箇所は見当たらない。
- Drizzle クエリビルダ（`eq`, `inArray`, `insert().values()`）および固定文字列DDLのみで、差分起因のSQLインジェクションリスクは低い。

## Verification

- `bun run typecheck`: 成功
- `bun run test`: 全件 skipped（実質的な回帰検知は未実施）
