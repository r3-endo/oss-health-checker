# Backend DDD / Hexagonal Review (2026-02-11)

## 対象
- `backend/src` 全体（`domain`, `application`, `interface`, `infrastructure`, `bootstrap`）
- 設計基準: DDD + Clean/Hexagonal, 指定の設計アーキテクチャ定義

## サマリ
- レイヤ分割と依存方向は概ね良好。
- ただし、エラー契約の不統一、ユースケース単位トランザクション不足、OpenAPI未接続が主要リスク。
- 「堅牢性」「拡張性」「クリーンさ」を上げるには、まずエラー契約統一が最優先。

## Findings（重大度順）

### 1. `refresh` だけエラー契約が別系統（高）
- `refresh` は `ok: false` を返すが、他ユースケースは `ApplicationError` を投げる。
- 参照:
  - `backend/src/application/use-cases/refresh-repository-use-case.ts:16`
  - `backend/src/application/use-cases/refresh-repository-use-case.ts:58`
  - `backend/src/interface/http/controllers/repository-controller.ts:48`
  - `backend/src/interface/http/error-mapper.ts:4`
- 影響:
  - 失敗時のHTTP意味論が揺れる（`200` + エラー情報になりうる）。
  - クライアント実装とドキュメント整合が難しくなる。

### 2. Domain層に外部依存語彙が混入（高）
- `domain/errors/refresh-error.ts` に `GITHUB_RATE_LIMIT` などが存在。
- 参照: `backend/src/domain/errors/refresh-error.ts:2`
- 影響:
  - Domainがインフラ事情（GitHub）を知る構造になり、境界が弱くなる。

### 3. `register` のトランザクション境界不足（高）
- `repository` 作成と `snapshot` 作成が別処理で、部分成功が起こりうる。
- 参照:
  - `backend/src/application/use-cases/register-repository-use-case.ts:52`
  - `backend/src/application/use-cases/register-repository-use-case.ts:66`
- 影響:
  - 異常系で不整合データが残る可能性。

### 4. OpenAPIが契約単一ソースになっていない（中）
- schema定義はあるがルーティングへ接続されていない。
- 参照:
  - `backend/src/infrastructure/openapi/schemas.ts:1`
  - `backend/src/interface/http/routes/repository-routes.ts:1`
- 影響:
  - 実装と仕様がドリフトしやすい。

### 5. Adapterで `as` キャスト依存（中）
- DB値からDomain値へ unsafe cast。
- 参照:
  - `backend/src/infrastructure/repositories/drizzle-snapshot-adapter.ts:25`
  - `backend/src/infrastructure/repositories/drizzle-repository-read-model-adapter.ts:38`
- 影響:
  - 破損データや予期しない値の検知が弱い。

### 6. スキーマ定義の二重管理（中）
- Drizzle schema と手書き migration SQL が重複。
- 参照:
  - `backend/src/infrastructure/db/drizzle/schema.ts:11`
  - `backend/src/infrastructure/db/drizzle/migrate.ts:5`
- 影響:
  - 片方更新漏れによる差分事故。

## 良好な点
- `application/domain/interface` から `infrastructure` への直接依存は見当たらない。
- `new` は `bootstrap` に集約されている。
- 参照:
  - `backend/src/bootstrap/build-container.ts:18`

## To-Be リファクタリング計画（優先順）

### Phase 1: エラー契約統一
1. `refresh` も失敗時は `ApplicationError` を投げる形に統一。
2. `RefreshError` を廃止または `application/errors` 側に統合。
3. HTTP変換は `error-mapper.ts` のみに集約。

### Phase 2: トランザクション境界の明確化
1. `application/ports` に `UnitOfWorkPort`（例: `runInTransaction<T>`）を追加。
2. `register` の repository + snapshot を同一トランザクション化。
3. Drizzle実装は `infrastructure` に閉じ込める。

### Phase 3: 契約の単一ソース化
1. OpenAPI route と request/response/error schema をルートに接続。
2. Controller内の重複Zod定義を整理し、OpenAPI定義由来に寄せる。

### Phase 4: 型安全強化
1. `ApplicationError.detail` を判別可能 union 化。
2. adapter内の unsafe cast を runtime validation/type guard へ置換。

### Phase 5: スキーマ運用整備
1. migration戦略を Drizzle起点で単一化。
2. CIで schema/migration 差分検知を追加。

### Phase 6: DDD純度向上（任意）
1. `snapshot-factory` の業務判定ロジックを domain service/value object へ移動検討。
2. URL正規化の value object 化を検討。

## Regression Best Practices
1. `eslint` でレイヤ境界を強制（`no-restricted-imports` 等）。
2. `interface` に渡す業務エラーは `ApplicationError` に統一。
3. 1ユースケース1トランザクション方針を明文化。
4. OpenAPI未接続エンドポイントをCIで検知。
5. 失敗系（外部依存失敗/境界値/null）を先に書くTDD運用。

## 現状テストベースライン
- 実行コマンド: `bun run test`（`backend`）
- 結果: 5 files / 27 tests passed
