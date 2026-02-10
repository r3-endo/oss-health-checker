# Backend Diff Review (2026-02-10)

対象: 現在の `git diff`（backend中心）
観点: 堅牢性 / クリーンコード / セキュリティ / 拡張性

## Findings

### 1. High - リポジトリ上限チェックが競合時に破れる（TOCTOU）
- 参照: `backend/src/application/use-cases/register-repository-use-case.ts:43`
- `count()` と `create()` が別操作のため、同時リクエスト時に両方が `repositoryCount < 3` を通過し、3件制限を超えて登録できる。
- 制限仕様をアプリ層だけで守っており、DB側に上限を担保する仕組みがない。
- 提案: 1トランザクション内で判定+挿入を実行する、または排他制御/制約テーブルを導入してDBで上限を担保する。

### 2. Medium - DB一意制約違反が `INTERNAL_ERROR` に潰され、期待される業務エラーにならない
- 参照: `backend/src/application/use-cases/register-repository-use-case.ts:76`
- `repositoryPort.create()` で URL の一意制約違反が起きても、現在は `catch` の最終分岐で `INTERNAL_ERROR` へ変換される。
- クライアントからは「重複登録」という再試行不能な入力エラーと、真のサーバ障害が区別できない。
- 提案: インフラ例外を `CONFLICT`/`VALIDATION_ERROR` 相当へ変換する分岐を追加し、HTTP 409 か 400 へマップする。

### 3. Medium - 一覧取得がスナップショット全件走査でスケールしない
- 参照: `backend/src/infrastructure/repositories/drizzle-repository-read-model-adapter.ts:62`
- `listWithLatestSnapshot()` が `snapshots` 全件を読み込んでメモリ上で最新1件を選別している。
- データ増加時にレスポンス劣化とメモリ負荷が直線的に増える。
- 提案: DBで「各 repository の最新 snapshot」を直接返すクエリ（サブクエリ / window function）へ置き換える。

### 4. Medium - Honoセキュリティミドルウェアが未設定（CORS/Secure Headers方針が未定義）
- 参照: `backend/src/bootstrap/build-app.ts:7`
- エンドポイント追加後も、`cors` と `secureHeaders` が未設定で、HTTPセキュリティ境界がコード上に明示されていない。
- 現状は同一オリジン前提なら即時脆弱性とは限らないが、クライアント追加時に意図しない公開設定を招きやすい。
- 提案: 許可オリジン/メソッドを固定した `cors`、および `secureHeaders` を `buildApp` で明示的に設定する。

## Positive Notes

- `buildApp` で `app.onError` / `app.notFound` を導入し、HTTPエラー応答が集中管理された点は良い。
- Controllerで `zod` によるリクエスト検証を追加し、ハンドラー責務が明確になった。

## Security

- 本差分内で、直接的なSQLインジェクション/コマンドインジェクション経路は未検出。
- ただしセキュリティヘッダ/CORSポリシーの明示不足は運用時の設定不備リスクとして残る。

## Verification

- `bunx vitest run tests/application/register-and-refresh-repository.test.ts tests/interface/http/repository-routes.integration.test.ts`: 成功（`9 passed`）
- `bun run typecheck`: 成功
