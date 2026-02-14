# Architecture (MVP)

## 設計思想
- **MVPで小さく保つ**: 実装は最小限、ただし将来の変更点が局所化される境界を先に作る。
- **Feature単位で分割する**: バックエンドは `development-health` と `ecosystem-adoption` を対等な機能軸として扱う。
- **依存方向を固定する**: 各 feature で `interface -> application -> domain`。`infrastructure` は `application` の `port` を実装する。
- **Composition Rootを集約する**: `new` は `shared/bootstrap` に集め、差し替えやテストを容易にする。
- **契約の単一ソース化**: status / warning reason / error code は domain/application の定義をAPIスキーマから再利用する。

## リポジトリレイアウト方針（移行中）

セルフホスト向けの分離に合わせ、レイアウトは以下へ段階移行する。

- `apps/backend`: API 実行アプリ
- `apps/batch`: 定期収集ジョブ実行アプリ
- `apps/frontend`: UI アプリ
- `packages/common`: 共有コード（app 間は直接依存せずここ経由）
- `db`: migration / drizzle / seed など DB 資産
- `infra`: compose / env / scripts など運用資産

ルール:
- `apps/*` 同士の直接 import は禁止し、共有は `packages/*` に集約する。
- `db` と `infra` は実行アプリではない。
- Dockerfile / `compose.yml` は別 OpenSpec change で実装する。

## Backend 構成（現行コード）

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

## エントリポイント（現行コード）
- `backend/src/index.ts`: 実行時の `env` を使って `buildContainer` + `buildApp` を実行。
- `backend/src/app.ts`: `shared/bootstrap` の組み立て関数を再エクスポート（テスト/起動の境界を明確化）。
- `backend/src/jobs/collect-daily-snapshots.ts`: development-health 用のバッチジョブを実行。
- `backend/src/jobs/collect-daily-adoption-snapshots.ts`: ecosystem-adoption 用のバッチジョブを実行。

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
