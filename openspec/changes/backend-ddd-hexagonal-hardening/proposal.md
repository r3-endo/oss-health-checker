## Why

バックエンドのレイヤ分離は概ね維持できている一方で、失敗時契約の不統一とユースケース単位トランザクション不足により、API意味論の揺れや部分成功によるデータ不整合リスクが残っている。今の段階で契約・境界・型安全を仕様として固定し、今後の機能追加でアーキテクチャ劣化を防ぐ必要がある。

## What Changes

- `refresh` を含む全ユースケースの失敗時契約を `ApplicationError` ベースへ統一し、HTTPエラー変換を単一経路へ集約する。
- Domain層から外部依存語彙を分離し、インフラ由来の失敗理由は application/infrastructure 境界で扱う。
- `register` ユースケースに Unit of Work を導入し、repository 作成と snapshot 作成を単一トランザクションで実行可能にする。
- OpenAPI の request/response/error schema を route へ接続し、API契約を実装と同一ソースで維持する。
- Adapter の unsafe cast を runtime validation / type guard に置換し、破損データ検知を強化する。
- Drizzle schema と migration の運用を単一方針へ寄せ、差分検知をCIゲートに追加する。

## Capabilities

### New Capabilities
- `application-error-contract`: ユースケース失敗を `ApplicationError` に統一し、HTTP層で一貫したステータスとエラーボディへ写像する。
- `transactional-use-case-boundary`: ユースケース単位でトランザクションを実行できる `UnitOfWorkPort` を提供し、複数永続化操作の原子性を担保する。
- `openapi-runtime-contract-binding`: OpenAPI schema を HTTP route に接続し、実装と契約のドリフトを防止する。
- `adapter-runtime-type-safety`: 永続化層からドメイン層への変換で runtime validation を適用し、unsafe cast を排除する。
- `drizzle-schema-migration-governance`: schema/migration の整合運用ルールと CI 差分検知を提供する。

### Modified Capabilities
- なし（既存の main spec は未作成のため、今回は新規 capability のみを定義）

## Impact

- Affected code:
  - `backend/src/application/use-cases/*`
  - `backend/src/application/errors/*`
  - `backend/src/application/ports/*`
  - `backend/src/domain/errors/*`
  - `backend/src/interface/http/controllers/*`
  - `backend/src/interface/http/error-mapper.ts`
  - `backend/src/interface/http/routes/*`
  - `backend/src/infrastructure/openapi/*`
  - `backend/src/infrastructure/repositories/*`
  - `backend/src/infrastructure/db/drizzle/*`
- APIs:
  - `/repositories/refresh` を含む失敗レスポンス契約の統一。
  - OpenAPI ドキュメントと実装ルートの結合強化。
- Dependencies/Tooling:
  - Bun ベースのテスト/CIに加え、schema/migration 差分検知ジョブを追加。
- Systems:
  - DB トランザクション境界と外部依存失敗時の挙動が安定し、回帰時の検知可能性が向上する。
