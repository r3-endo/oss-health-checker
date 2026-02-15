# Architecture (MVP)

## 設計思想
- **MVPで小さく保つ**: 実装は最小限、ただし将来の変更点が局所化される境界を先に作る。
- **Feature単位で分割する**: バックエンドは `development-health` と `ecosystem-adoption` を対等な機能軸として扱う。
- **依存方向を固定する**: `interface -> application -> domain`。`infrastructure` は `application` の `port` を実装する。
- **Composition Rootを集約する**: `new` は `shared/bootstrap` に集め、差し替えやテストを容易にする。
- **契約の単一ソース化**: status / warning reason / error code は domain/application の定義をAPIスキーマから再利用する。

## Repository Layout

- `apps/backend`: API 実行アプリ（エントリポイント） + backend 専用 feature 実装（`src/features`）
- `apps/batch`: 定期収集ジョブ実行アプリ（エントリポイント）
- `apps/frontend`: UI アプリ
- `apps/common`: backend/batch 共通の application・domain・infrastructure 層と shared 基盤。HTTP interface 層は含まない。
- `db`: migration / drizzle artifacts / sqlite ファイルなど DB 資産
- `infra`: compose / env / scripts など運用資産

依存方向ルール:
- `apps/*` は `apps/common` に依存してよいが、`apps/*` 同士の直接依存は禁止。
- `apps/common` 内は feature ごとに `interface -> application -> domain` の方向を守る。
- `db` と `infra` は実行アプリではなく、コード所有境界として扱う。

## Backend/Batch 構成（現行コード）

### `apps/backend/src`
- `server.ts`: Node サーバ起動エントリ。
- `build-container.ts`: DI と adapter の配線（Composition Root）。
- `build-app.ts`: Hono app への route 配線。
- `app.ts`: 再エクスポート境界（起動/テスト分離）。

### `apps/backend/src/features`
- `development-health/interface/http`: HTTP controllers, routes, OpenAPI schemas, error-mapper
- `ecosystem-adoption/interface/http`: HTTP controllers, routes, OpenAPI schemas, error-mapper
- `dashboard-overview/interface/http`: HTTP controllers, routes, OpenAPI schemas, error-mapper
- `dashboard-overview/application`: dashboard-overview 専用の application 層（丸ごと backend 所有）

### `apps/batch/src`
- `collect-daily-snapshots.ts`: development-health の日次収集ジョブ。
- `collect-daily-adoption-snapshots.ts`: ecosystem-adoption の日次収集ジョブ。

### `apps/common/src/features`
- `development-health`: GitHub由来の開発健全性シグナル。
- `ecosystem-adoption`: npm等の採用実態シグナル。
- `dashboard-overview`: ダッシュボード集約取得。

### `apps/common/src/shared`
- `config/env.ts`: 環境変数解決。
- `infrastructure/db/drizzle/*`: DBハンドル・schema・migration・seed。

## 変更に強くするためのルール
- 新機能は `features/<feature>/application/use-cases` と `ports` から追加する。
- `ports` は feature 内に閉じる。全体共通 `ports` ディレクトリは作らない。
- `interface/http` には業務ルールを置かない。
- backend 専用の HTTP interface 層は `apps/backend/src/features/*/interface/http/` に配置する。
- `apps/common` には cross-app で再利用される application/domain/infrastructure のみを配置する。
- `infrastructure` の型は controller に露出させない。
- エラーは `ApplicationError` に正規化し、HTTP変換は feature の `error-mapper.ts` に集約する。

### backend/common 境界の強制基準
- `apps/batch` は `apps/backend/interface/*` を直接 import してはならない。
- `apps/common` は `apps/backend/*` を直接 import してはならない。
- backend 専用 use-case/read-model/port/adapter は `apps/backend/src/features/*` に配置し、`apps/common` には残さない。
- `apps/common` へ実装を追加する場合は、batch/backend の双方から利用される証跡（import 実績）が必要。
- 境界違反は `backend/tests/contracts/feature-ownership-boundary.test.ts` と `backend/tests/contracts/app-layout-boundary.test.ts` で検出し、CI `backend-ci` の `boundary-contract` ジョブで fail させる。

## Frontend 設計

### 設計思想
- **Feature単位で閉じる**: 画面・API・model・hooksを `features/*` に集約する。
- **責務分離を優先**: ページは composition、表示は `ui/components`、サーバー通信は `api`、非同期状態は `hooks`。
- **依存注入で差し替え可能にする**: API adapter の concrete は `app` で組み立てる。
- **状態の原則を固定する**: サーバー状態は TanStack Query、UIローカル状態はコンポーネント内部。グローバルUI状態は必要時のみ導入する。

## 旧導線の扱い（移行期間）

- ルート直下の `backend/` はテスト・設定・スクリプトのみ残存する互換レイヤー。`backend/src/` への新規実装追加は禁止。
- 新規機能は `apps/*` に実装する。
- 契約テスト `app-layout-boundary.test.ts` が旧導線への実装混入を自動検知する。
- `frontend/` は削除済みで、frontend 実装は `apps/frontend` に統一済み。

## Docker 化の扱い

- Dockerfile / `compose.yml` 実装は本 change の範囲外。
- 次の OpenSpec change で `infra/compose` を中心に導入する。
