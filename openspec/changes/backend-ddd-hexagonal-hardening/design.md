## Context

`docs/reviews/2026-02-11-backend-ddd-hexagonal-review.md` で、既存 backend 実装はレイヤ分離自体は維持されている一方、失敗時契約、トランザクション境界、OpenAPI 接続、adapter 型安全、schema/migration 運用に構造的な改善余地があることが示された。

現状の代表例は次の通り。
- `refresh` だけが `ok: false` 戻り値を返し、他ユースケースは `ApplicationError` を throw する。
- `register` の `repository` 作成と `snapshot` 作成が別操作で、部分成功のリスクがある。
- OpenAPI schema が route に未接続で、実装とのドリフト検知が弱い。
- Drizzle adapter 内で `as` キャストに依存し、永続化値の破損検知が弱い。
- Drizzle schema と migration SQL が二重管理されている。

制約:
- Layered + Hexagonal の依存方向は維持する。
- Bun 実行系（`bun run <script>`）を前提にする。
- 失敗系（外部依存失敗、境界値、null）を受け入れ条件に含める。

## Goals / Non-Goals

**Goals:**
- ユースケース失敗契約を `ApplicationError` に統一し、HTTP 意味論の不一致を解消する。
- `ApplicationError.detail` を判別可能 union として定義し、エラーごとの detail 契約を型で固定する。
- `register` をユースケース単位トランザクションへ移行し、永続化の原子性を担保する。
- OpenAPI を runtime route と接続し、契約を単一ソース化する。
- adapter の unsafe cast を runtime validation へ置換し、型安全を強化する。
- schema/migration の運用を一本化し、CI で差分検知できる状態にする。

**Non-Goals:**
- 新機能 API の追加（エンドポイント増設やビジネス機能拡張）。
- DDD 純度向上の任意改善（domain service 再配置や value object 化）の全面実施。
- DB エンジン変更や大規模な ORM 置換。

## Decisions

1. 失敗時契約は「UseCase は成功値を返し、失敗は `ApplicationError` を throw」に統一する。
- 実装方針:
  - `RefreshRepositoryResult` の失敗 union を廃止し、`refresh` でも `ApplicationError("RATE_LIMIT" | "EXTERNAL_API_ERROR" | "INTERNAL_ERROR")` を利用する。
  - HTTP 変換は `backend/src/interface/http/error-mapper.ts` のみを入口にし、controller では失敗時レスポンス組み立てを行わない。
- 選択理由: `register`/`list` と同一モデルに揃えることで、クライアント・OpenAPI・テストの整合性を確保できる。
- 代替案: `Result<T, E>` パターンへ全ユースケースを統一。
- 代替を採らない理由: 現行コードの大半が例外契約で構築済みで、変更範囲と回帰リスクが過大。

2. Domain から外部依存語彙を排除し、外部起因エラーの表現は application 層で閉じる。
- 実装方針:
  - `domain/errors/refresh-error.ts` を削除または非公開化し、エラーコードの canonical 定義は `application/errors/application-error.ts` に集約する。
  - OpenAPI エラー schema は `ApplicationError` コード集合を参照する。
- 選択理由: Domain をユビキタス言語に限定し、GitHub など外部都合のリークを防ぐ。
- 代替案: domain に汎用 `ExternalError` を残す。
- 代替を採らない理由: 結局 adapter/application 依存の詳細を逆流させる温床になる。

3. ユースケース単位トランザクションを `UnitOfWorkPort` で抽象化する。
- 実装方針:
  - `backend/src/application/ports/unit-of-work-port.ts` に `runInTransaction<T>(work: (tx: TransactionPorts) => Promise<T> | T): Promise<T>` を追加する。
  - `TransactionPorts` は少なくとも `repositoryPort` と `snapshotPort` を持つ tx スコープ port 群とする。
  - `RegisterRepositoryService` は通常 port ではなく `tx.repositoryPort` / `tx.snapshotPort` を通じて `createWithLimit` と `snapshot insert` を実行する。
  - Drizzle 実装は infrastructure に `DrizzleUnitOfWorkAdapter` を追加し、1つの DB transaction 内で tx スコープ adapter を生成して `work` に渡す。
- 選択理由: Hexagonal を崩さずに原子性と一貫性を確保できる。
- 代替案: `RepositoryPort` 側に複合メソッドを追加して隠蔽。
- 代替を採らない理由: ユースケース責務を repository 側へ押し込み、再利用性が下がる。

4. OpenAPI schema を route 定義へ接続し、request/response/error を実装と同時に検証する。
- 実装方針:
  - ルート層を `@hono/zod-openapi` ベースへ移行し、`repository-routes.ts` で各 endpoint の request/response/error schema を登録する。
  - controller 内の重複 `zod` バリデーションは route 側に寄せ、controller は use case 呼び出しに集中させる。
- 選択理由: 仕様ドリフトを CI で検知しやすくなる。
- 代替案: 現行ルートを維持して別途 doc 生成のみ追加。
- 代替を採らない理由: runtime 契約検証が行えず、乖離が残る。

5. adapter の DB→Domain 変換には runtime validation を導入する。
- 実装方針:
  - `status` / `warningReasons` に対する type guard または zod schema を infrastructure mapper に追加。
  - 不正値検出時は `ApplicationError("INTERNAL_ERROR")` へ変換し、原因情報は detail に保持する。
- 選択理由: `as` キャスト由来のサイレント破損を防げる。
- 代替案: DB check 制約のみを信頼しキャスト継続。
- 代替を採らない理由: データ汚染や将来 migration ミス時の防御が不十分。

6. migration 運用は Drizzle schema 起点に一本化し、CI で drift を検出する。
- 実装方針:
  - 手書き SQL ベースの `migrate.ts` 依存を段階的に削減し、Drizzle migration 生成/適用フローへ統一する。
  - CI に schema と migration の整合チェック（生成差分がないこと）を追加する。
- 選択理由: 二重管理の更新漏れ事故を防げる。
- 代替案: 現行手書き SQL を正として schema を追従。
- 代替を採らない理由: 型情報と実 DDL の整合を人手維持するコストが高い。

7. `ApplicationError.detail` を判別可能 union 化し、error code ごとの detail 形状を固定する。
- 実装方針:
  - `ApplicationError` を `code` と連動する detail 型（例: `RATE_LIMIT` は `retryAfterSeconds` を許容、`VALIDATION_ERROR` は `reason`/`limit` を許容）へ再定義する。
  - `error-mapper.ts` と OpenAPI エラー schema を同一の型集合から生成する。
- 選択理由: controller/use case/OpenAPI の detail 形状不一致をコンパイル時に検知できる。
- 代替案: `detail?: Record<string, unknown>` を維持。
- 代替を採らない理由: 契約逸脱がレビュー依存になり、回帰を防ぎにくい。

8. レイヤ境界と OpenAPI 接続状態を CI ゲートで強制する。
- 実装方針:
  - `eslint` の `no-restricted-imports` で `application/domain/interface` から `infrastructure` への不正依存を禁止する。
  - OpenAPI 未接続 endpoint を検出する contract test を追加し、CI 必須ジョブ化する。
- 選択理由: 設計ルールを人手運用ではなく自動検知に移せる。
- 代替案: レビュー運用のみで統制。
- 代替を採らない理由: 継続運用での漏れを防げない。

## Risks / Trade-offs

- [`refresh` 契約変更でクライアント互換性が壊れる] → Mitigation: OpenAPI と API テストを同時更新し、`200 + error payload` ケースを明示的に廃止する。必要なら短期的に互換レスポンスを feature flag 配下で提供する。
- [UnitOfWork 導入で adapter 構造が複雑化する] → Mitigation: `TransactionPorts` を `repositoryPort`/`snapshotPort` の最小集合に固定し、tx スコープ外 port を混在させない。
- [OpenAPI 接続移行で route 実装の書き換え量が増える] → Mitigation: `/repositories` 系 3 endpoint から段階移行し、1 endpoint ごとに contract test を追加する。
- [runtime validation 追加で read path にオーバーヘッド] → Mitigation: 検証対象を境界値フィールドに限定し、ホットパスの計測結果で閾値超過時のみ最適化する。
- [migration 戦略変更中の運用不整合] → Mitigation: 移行期間は CI で旧新両チェックを併用し、切替完了後に旧経路を削除する。

## Migration Plan

1. エラー契約統一の Red テストを追加（`refresh` の失敗時が `ApplicationError` であること、HTTP ステータスが 429/502 に写像されること）。
2. `refresh` 実装と `error-mapper` 参照定義を統一し、`domain/errors/refresh-error.ts` 依存を除去。
3. `UnitOfWorkPort` と Drizzle adapter を追加し、`register` を同一トランザクション化。部分成功を再現する失敗系テストで検証。
4. route を OpenAPI 接続版へ移行し、request/response/error schema を endpoint ごとに適用。
5. adapter runtime validation を導入し、不正データ検出時の失敗系テストを追加。
6. schema/migration 運用を Drizzle 起点へ移行し、CI に drift check を追加。
7. `ApplicationError.detail` を判別可能 union 化し、error schema と API テストを更新。
8. `eslint` レイヤ境界ルールと OpenAPI 接続 contract test を CI 必須化。
9. ロールバック方針:
- 互換性問題が出た場合は `refresh` の新契約を feature flag で無効化し、旧レスポンス経路へ一時退避する。
- migration 系問題は直近安定 revision へ戻し、DB ファイルのバックアップから復旧する。

## Open Questions

- `ApplicationError.code` は既存コード（`RATE_LIMIT` 等）を維持するか、将来を見据えて namespaced（例: `EXTERNAL_RATE_LIMIT`）へ再編するか。
- `UnitOfWorkPort` の tx 伝搬をどこまで明示化するか（adapter 内暗黙保持 vs context 引数で明示）。
- OpenAPI 生成物（JSON/YAML）をリポジトリに commit するか、CI 生成のみで運用するか。
- runtime validation 実装を zod に統一するか、軽量 type guard を併用するか（性能要件次第）。

## Post-Implementation Decisions

1. `snapshot-factory` の業務判定ロジックは今回は **defer** とする。
- 理由: 現在の判定は副作用がなく、ドメイン知識の散逸よりも変更コストが上回るため。
- 影響: 既存の `application/services/snapshot-factory.ts` を維持し、境界条件テストで挙動を固定する。
- 将来方針: 判定ルールが増えた時点で domain service へ昇格を再評価する。

2. GitHub URL 正規化の value object 化は今回は **defer** とする。
- 理由: `parseGitHubRepositoryUrl` は既に pure function + テストで安定しており、現時点では導入効果が限定的。
- 影響: 現行の application service を維持し、入力契約は route schema と use case で担保する。
- 将来方針: URL 正規化ルールが複数 provider に拡張されるタイミングで value object 化を再検討する。
