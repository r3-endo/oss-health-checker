## 1. Quality Gates and TDD Baseline

- [x] 1.1 `backend` に本変更用の失敗系テスト計画を追加し、各 capability ごとの Red ケースを先に作成する
- [x] 1.2 `bun run test` / `bun run lint` を本変更のローカル・CI共通 entrypoint として整理する
- [x] 1.3 OpenAPI contract テストジョブと schema/migration drift ジョブを CI 必須化し、ジョブ名と実行スクリプト名を定義する

## 2. Application Error Contract Unification

- [x] 2.1 `refresh-repository-use-case` の失敗 union 戻り値を廃止し、失敗時は `ApplicationError` throw に統一する
- [x] 2.2 `RepositoryGatewayError` から `ApplicationError`（`RATE_LIMIT` / `EXTERNAL_API_ERROR`）への変換を refresh 側へ実装する
- [x] 2.3 `domain/errors/refresh-error.ts` の provider 固有語彙依存を除去し、エラーコード定義を application 側へ集約する
- [x] 2.4 `error-mapper.ts` を唯一の HTTP エラー変換経路として固定し、refresh 失敗時の 200 応答を禁止する
- [x] 2.5 `ApplicationError.detail` を判別可能 union 型へ更新し、`VALIDATION_ERROR={ reason?: string; limit?: number }`、`RATE_LIMIT={ status?: number; retryAfterSeconds?: number | null }`、`EXTERNAL_API_ERROR={ status?: number }`、`INTERNAL_ERROR={ cause?: string }`、`NOT_FOUND=undefined` を受け入れ条件として固定する
- [x] 2.6 refresh の失敗系 API テスト（429/502/404/500）を追加して契約統一を検証する

## 3. Transactional Use-Case Boundary

- [x] 3.1 `application/ports` に `UnitOfWorkPort` と `TransactionPorts`（`repositoryPort` / `snapshotPort`）を追加する
- [x] 3.2 Drizzle 用 `DrizzleUnitOfWorkAdapter` を実装し、単一 transaction 内で tx スコープ adapter を提供する
- [x] 3.3 `RegisterRepositoryService` を `runInTransaction` ベースへ移行し、repository 作成と snapshot 作成を同一境界で実行する
- [x] 3.4 snapshot 書き込み失敗時に repository がロールバックされることを再現テストで保証する
- [x] 3.5 application 層から drizzle 型/モジュールに直接依存していないことを静的検査で確認する

## 4. OpenAPI Runtime Contract Binding

- [x] 4.1 `repository-routes` を OpenAPI バインディング対応へ移行し、3 endpoint（POST/GET/refresh）を contract 化する
- [x] 4.2 register/list/refresh の request/response/error schema を route 定義へ接続する
- [x] 4.3 controller 内の重複 Zod 入力検証を削減し、route schema を単一入力契約にする
- [x] 4.4 OpenAPI ドキュメント生成を runtime route 定義由来へ統一する
- [x] 4.5 OpenAPI 未接続 endpoint が存在した場合に失敗する contract テスト（例: `backend/tests/contracts/openapi-route-binding.test.ts`）を実装する

## 5. Adapter Runtime Type Safety

- [x] 5.1 `drizzle-snapshot-adapter` の status / warningReasons 変換で runtime validation（type guard または zod）を実装する
- [x] 5.2 `drizzle-repository-read-model-adapter` の同等変換箇所で unsafe cast を除去する
- [x] 5.3 未知 status 値・未知 warning reason 値を与えた場合に fail-fast するテストを追加する
- [x] 5.4 不正永続化値を検出した際の `ApplicationError("INTERNAL_ERROR")` 変換と detail 付与を実装する
- [x] 5.5 enum-like フィールド変換に `as` キャストを再導入できないよう lint かレビューガードを追加する

## 6. Drizzle Schema and Migration Governance

- [x] 6.1 migration 実行経路を Drizzle schema 起点の単一フローへ整理し、`migrate.ts` 手書き SQL 依存を段階的に削減する
- [x] 6.2 schema 変更時に migration artifact 更新が必須になるよう開発手順とスクリプトを整備する
- [x] 6.3 schema/migration drift 検知コマンド（例: `bun run check:drizzle-drift`）を追加し、CI で差分時に失敗させる
- [x] 6.4 drift 失敗ログに再生成用の具体コマンドを表示する
- [x] 6.5 ローカルと CI が同一 migration コマンド系を実行することを検証テストまたはジョブで保証する

## 7. Regression and Documentation

- [x] 7.1 `eslint` `no-restricted-imports` でレイヤ境界（application/domain/interface → infrastructure 直接依存禁止）を強制する
- [x] 7.2 失敗系（外部依存失敗・境界値・null）を先に書く TDD 手順を backend 開発ドキュメントに明記する
- [x] 7.3 本変更の API 契約差分（refresh エラー契約変更）と移行注意点をドキュメント化する
- [x] 7.4 最終回帰として `bun run lint` と `bun run test` を実行し、結果を change に記録する

## 8. Optional DDD Purity Improvements

- [x] 8.1 `snapshot-factory` の業務判定ロジックを domain service/value object へ移す可否を評価し、採用/defer の設計判断と理由を記録する
- [x] 8.2 GitHub URL 正規化の value object 化を実施するか defer するかを判断し、理由・影響範囲・移行方針を記録する

## Regression Log

- 2026-02-11: `cd backend && bun run lint` ✅
- 2026-02-11: `cd backend && bun run test` ✅ (`10` files passed, `42` tests passed, `4` todo)
