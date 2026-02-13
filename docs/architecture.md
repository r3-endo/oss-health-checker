# Architecture (MVP)

## 設計思想
- **MVPで小さく保つ**: 実装は最小限、ただし将来の変更点が局所化される境界を先に作る。
- **Feature単位で分割する**: バックエンドは `development-health` と `ecosystem-adoption` を対等な機能軸として扱う。
- **依存方向を固定する**: 各 feature で `interface -> application -> domain`。`infrastructure` は `application` の `port` を実装する。
- **Composition Rootを集約する**: `new` は `shared/bootstrap` に集め、差し替えやテストを容易にする。
- **契約の単一ソース化**: status / warning reason / error code は domain/application の定義をAPIスキーマから再利用する。

## Backend 構成

### `backend/src/features/development-health`
- GitHub由来の「開発健全性シグナル」を扱う feature。
- 主な責務:
  - `domain/models/*`: health score / status / snapshot などのドメインルール
  - `application/use-cases/*`: register / refresh / list / category detail のユースケース
  - `application/ports/*`: GitHub・DB・read model への境界
  - `infrastructure/gateways/*`: GitHub API アダプタ
  - `infrastructure/repositories/*`: Drizzle経由の永続化アダプタ
  - `interface/http/*`: route / controller / openapi / error mapping

### `backend/src/features/ecosystem-adoption`
- npm, Maven Central, PyPI, Homebrew, Docker由来の「採用実態シグナル」を扱う feature。
- `application/ports/registry-provider-port.ts` を中心に provider plugin を拡張する。
- 各データ源の実装は `infrastructure/providers/<source>/` に閉じ込める。

### `backend/src/shared`
- feature横断の基盤を置く。
- `config/env.ts`: 環境変数解決
- `infrastructure/db/drizzle/*`: DBハンドル・schema・migration・seed
- `bootstrap/build-container.ts`: feature実装を組み立てる composition root
- `bootstrap/build-app.ts`: Hono app に HTTP route を配線

## エントリポイント
- `index.ts`: 実行時の `env` を使って `buildContainer` + `buildApp` を実行。
- `app.ts`: `shared/bootstrap` の組み立て関数を再エクスポート（テスト/起動の境界を明確化）。
- `jobs/collect-daily-snapshots.ts`: development-health 用のバッチジョブを実行。

## 変更に強くするためのルール
- 新機能は `features/<feature>/application/use-cases` と `ports` から追加する。
- `ports` は feature 内に閉じる。全体共通 `ports` ディレクトリは作らない。
- `interface/http` には業務ルールを置かない。
- `infrastructure` の型は controller に露出させない。
- エラーは `ApplicationError` に正規化し、HTTP変換は feature の `error-mapper.ts` に集約する。

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
  - `repository-api-factory.ts`: `RepositoryApiPort` の concrete を組み立てる composition root
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
- UI描画ロジックは持たず、データ取得・キャッシュ無効化・エラー表示用メッセージの解決に集中する。
- UI層が adapter の具体エラー型に依存しないよう、表示に必要なエラー情報は hooks が吸収して返す。

#### `frontend/src/features/repositories/ui`
- `RepositoriesPage`: 画面の組み立て（composition）のみ担当。
- `components/*`: 表示/入力の責務を小さく分割して担当。

### Frontend 実装ルール
- `new HttpRepositoryApiAdapter(...)` を `ui` で直接生成しない。`app` 層のProvider経由で注入する。
- APIレスポンスの parse とエラー判定は adapter で完了させ、UIは成功/失敗状態を表示するだけにする。
- UIコンポーネント/ページから adapter 具象 (`RepositoryApiError` など) を直接参照しない。必要な表示文言は hooks 経由で受け取る。
- 機能追加時は `Page` に直接ロジックを足さず、まず `hooks` と `components` の責務分割を維持する。
