# Backend Architecture Review (2026-02-10)

対象:
- `backend/src`

方針:
- MVPのスコープは維持する
- ただし将来のリファクタ時に最小変更で済むよう、責務境界と依存方向を先に整える

## Findings (ordered by severity)

1. **High**: Composition Root が `app.ts` に固定され、テスト/差し替えが困難
- 現状、`env` の解決・DBハンドル作成・Adapter注入・Controller注入が `app.ts` のモジュール初期化時に固定実行される。
- これにより、ユースケース単位テストやインメモリ差し替え、将来の実行環境差し替え（CLI/Worker/HTTP分離）がやりづらい。
- 参照: `backend/src/app.ts:3`, `backend/src/app.ts:11`, `backend/src/app.ts:15`, `backend/src/app.ts:19`
- 推奨: `buildApp(deps)` / `buildContainer(env)` を分離し、`index.ts` で本番構成を組み立てる。

2. **High**: 一覧ユースケースが N+1 取得構造で、データアクセス責務が分散
- `RepositoryService.listWithLatestSnapshot` が `list()` 後に repository ごとに `findLatestByRepositoryId()` を呼んでおり、件数増で劣化する。
- `SnapshotPort` には `findLatestForAllRepositories()` があるが、結合戦略がサービスに露出していて責務境界が曖昧。
- 参照: `backend/src/application/services/repository-service.ts:16`, `backend/src/application/services/repository-service.ts:20`, `backend/src/application/ports/snapshot-port.ts:7`
- 推奨: 「一覧 + 最新snapshot」を返す Query Port を1つ定義し、取得戦略をインフラ側に閉じる。

3. **Medium**: 契約定義が二重化され、型ドリフトが起きやすい
- `status` / `warningReasons` の列挙が Domain と OpenAPI で重複している。
- 変更時に API schema と domain model が不整合になるリスクがある。
- 参照: `backend/src/domain/models/status.ts:1`, `backend/src/domain/models/status.ts:5`, `backend/src/infrastructure/openapi/schemas.ts:3`, `backend/src/infrastructure/openapi/schemas.ts:5`
- 推奨: Domain定数を API schema 生成時に再利用するか、`contract/` レイヤーに単一定義を置く。

4. **Medium**: 永続化境界で不変条件を担保する制約が不足
- `snapshots.repository_id` に外部キー制約がなく、`repositories.url` の一意制約もない。
- アプリ側バグ時に不整合データが混入しやすい。
- 参照: `backend/src/infrastructure/db/drizzle/schema.ts:5`, `backend/src/infrastructure/db/drizzle/schema.ts:14`
- 推奨: FK / unique / 必要最小インデックス（`snapshots(repository_id, fetched_at)`）をMVP段階で追加。

5. **Medium**: Controller が具体Serviceに直接依存し、差し替え境界が弱い
- `RepositoryController` は `RepositoryService` 具象型に依存しており、ユースケース増加時にHTTP層のテスト差し替えが硬くなる。
- 参照: `backend/src/interface/http/controllers/repository-controller.ts:2`, `backend/src/interface/http/controllers/repository-controller.ts:5`
- 推奨: Controller は `ListRepositoriesUseCase` などの入力境界インターフェースに依存させる。

6. **Low**: エラー分類は存在するが、伝播ポリシーが未定義
- `RefreshError` 型はあるが、Application→HTTPのマッピング規約（HTTP status, error envelope）が層横断で定義されていない。
- 参照: `backend/src/domain/errors/refresh-error.ts:1`, `backend/src/interface/http/controllers/repository-controller.ts:7`
- 推奨: `application/errors` と `interface/http/error-mapper` を置き、失敗系の標準化を先に決める。

## Minimal Refactor Blueprint (MVP-safe)

1. `src/bootstrap/` を新設し、構成責務を集約
- `buildContainer.ts`: env 受け取り、ports/adapters/use-cases を組み立てる
- `buildApp.ts`: container 受け取り、Hono routes を構成
- 効果: テスト時は fake adapter を差し替えるだけで済む

2. Application層を UseCase 単位へ薄く分割
- `ListRepositoriesWithLatestSnapshotUseCase`
- `RegisterRepositoryUseCase`
- `RefreshRepositoryUseCase`
- 効果: Controller は use case 呼び出し専用になり、責務が明確化

3. Query Port を導入して一覧取得の責務を1点化
- 例: `RepositoryReadModelPort.listWithLatestSnapshot()`
- 効果: N+1防止ロジックをインフラへ閉じ込め、サービスの複雑度を下げる

4. Domain/API 契約の単一化
- `status` / `warningReasons` を単一ソース化し、OpenAPI schemaはそこから生成
- 効果: 仕様変更時の漏れを削減

5. DB制約の最小強化
- FK (`snapshots.repository_id -> repositories.id`)
- Unique (`repositories.url`)
- Index (`snapshots.repository_id`, `snapshots.fetched_at`)
- 効果: 不整合混入をDBレベルで抑止

## Suggested Responsibility Placement

1. `domain/`
- エンティティ、値オブジェクト、純粋判定ロジック（status判定、warning理由生成）

2. `application/`
- ユースケース、トランザクション境界、失敗種別のアプリ内定義
- 依存先は `ports` のみ

3. `infrastructure/`
- Drizzle実装、GitHub API実装、env実装
- 技術詳細を閉じ込める

4. `interface/http/`
- ルーティング、DTO変換、エラーマッピング
- ビジネスルールは持たない

5. `bootstrap/`
- 依存注入の組み立てのみ（唯一の new 集中点）

## Open Questions

1. MVPで `repository` 上限は3件固定だが、将来10+件を見据えた読み取り性能要件を今どこまで取り込むか。
2. `contributors_count` は表示専用か、将来の分類条件に入れる予定があるか（契約配置に影響）。
3. 今回の段階で OpenAPI を配布物として厳密運用するか（型単一化の優先度に影響）。

## Summary

現状は「層分割の方向性」は良いが、実運用前提の変更容易性は Composition Root、読み取り責務、契約単一化の3点がボトルネック。上記の最小リファクタ案はMVPスコープを増やさず、将来変更時の影響範囲を小さくできる。
