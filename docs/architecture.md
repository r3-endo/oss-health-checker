# Architecture (MVP)

## 設計思想
- **MVPで小さく保つ**: 実装は最小限、ただし将来の変更点が局所化される境界を先に作る。
- **依存方向を固定する**: `interface -> application -> domain`。`infrastructure` は `application` の `port` を実装する。
- **Composition Rootを1箇所に集約する**: `new` は `bootstrap` に集め、差し替えやテストを容易にする。
- **契約の単一ソース化**: status / warning reason / error code は domain/application の定義をAPIスキーマから再利用する。

## レイヤ責務

### `backend/src/domain`
- エンティティ・値オブジェクト・業務上の列挙定義を置く。
- 外部I/Oに依存しない純粋な型/ルールを保持する。
- 例:
  - `models/status.ts`: ステータスと警告理由の単一ソース
  - `models/repository.ts`, `models/snapshot.ts`: ドメインモデル
  - `errors/refresh-error.ts`: リフレッシュ失敗コード定義

### `backend/src/application`
- ユースケースと入力/出力境界（Port）を置く。
- ビジネスフローを記述し、技術詳細は知らない。
- 例:
  - `use-cases/list-repositories-with-latest-snapshot-use-case.ts`
  - `ports/repository-read-model-port.ts`
  - `errors/application-error.ts`
  - `read-models/repository-with-latest-snapshot.ts`

### `backend/src/interface/http`
- HTTP入出力の責務を持つ（routing/controller/error mapping）。
- ユースケース呼び出しとレスポンス整形のみを行う。
- 例:
  - `routes/repository-routes.ts`
  - `controllers/repository-controller.ts`
  - `error-mapper.ts`

### `backend/src/infrastructure`
- 技術実装を配置する（DB, 外部API, 設定, OpenAPI schema）。
- Portの実装詳細を閉じ込める。
- 例:
  - `db/drizzle/*`: DBハンドルとスキーマ
  - `repositories/*-adapter.ts`: Port実装
  - `config/env.ts`: 環境変数解決
  - `openapi/schemas.ts`: APIスキーマ

### `backend/src/bootstrap`
- 依存注入の組み立て専用。
- どの実装を使うかを決める唯一の場所。
- 例:
  - `build-container.ts`: use case / adapter / controller を組み立てる
  - `build-app.ts`: Hono app に route を配線する

## エントリポイント
- `index.ts`: 実行時の `env` を使って `buildContainer` + `buildApp` を実行。
- `app.ts`: `buildApp`, `buildContainer` を再エクスポート（テスト/起動の境界を明確化）。

## 変更に強くするためのルール
- 新しい機能はまず `application/use-cases` と `application/ports` を追加してから実装する。
- `interface/http` には業務ルールを置かない。
- `infrastructure` の型は直接UI/Controllerに露出させない。
- エラーは `ApplicationError` に正規化し、HTTP変換は `error-mapper.ts` に集約する。

## Frontend 設計

### 設計思想
- **Feature単位で閉じる**: 画面・API・model・hooksを `features/*` に集約する。
- **責務分離を優先**: ページは composition、表示は `ui/components`、サーバー通信は `api`、非同期状態は `hooks`。
- **依存注入で差し替え可能にする**: API adapter の concrete は `app` で組み立てる。
- **状態の原則を固定する**: サーバー状態は TanStack Query、UIローカル状態はコンポーネント内部。グローバルUI状態は必要時のみ導入する。

### ディレクトリ責務

#### `frontend/src/app`
- アプリ全体のProviderと依存注入を管理する。
- 例:
  - `providers.tsx`: QueryClient + API Provider の配線
  - `repository-api-provider.tsx`: `RepositoryApiPort` の注入境界
  - `query-client.ts`: query/mutation の共通ポリシー

#### `frontend/src/features/repositories/api`
- API契約（Port）とHTTP実装（Adapter）を配置する。
- HTTPエラーの正規化はここで完結させる。

#### `frontend/src/features/repositories/model`
- zod schema と型定義の単一ソースを置く。
- 型は schema から導出し、重複定義を避ける。

#### `frontend/src/features/repositories/hooks`
- React Query の query/mutation hook を配置する。
- UI描画ロジックは持たず、データ取得・キャッシュ無効化に集中する。

#### `frontend/src/features/repositories/ui`
- `RepositoriesPage`: 画面の組み立て（composition）のみ担当。
- `components/*`: 表示/入力の責務を小さく分割して担当。

### Frontend 実装ルール
- `new HttpRepositoryApiAdapter(...)` を `ui` で直接生成しない。`app` 層のProvider経由で注入する。
- APIレスポンスの parse とエラー判定は adapter で完了させ、UIは成功/失敗状態を表示するだけにする。
- 機能追加時は `Page` に直接ロジックを足さず、まず `hooks` と `components` の責務分割を維持する。
