# application-runtime-layout Specification

## Purpose
TBD - created by archiving change separate-app-layout-from-dockerization. Update Purpose after archive.
## Requirements
### Requirement: リポジトリは実行アプリ単位でディレクトリ分離される
The system MUST separate runnable applications under `apps/` as `apps/frontend`, `apps/backend`, and `apps/batch`, and MUST treat these directories as the only canonical runtime entrypoints.

#### Scenario: 実行アプリの配置が規約に一致する
- **WHEN** 開発者がリポジトリ構成を確認する
- **THEN** 実行可能アプリは `apps/frontend` `apps/backend` `apps/batch` に配置されていなければならない

#### Scenario: ルート直下 app は正式実行入口として扱われない
- **WHEN** 開発者が起動・テスト・CI の実行入口を確認する
- **THEN** `backend` および `frontend` 直下は正式入口として扱われず、`apps/*` が唯一の実行入口でなければならない

### Requirement: 共有コードは packages 経由で利用される
The system MUST place cross-app shared code under `packages/*` and MUST prevent direct app-to-app source dependency.

#### Scenario: backend が batch の実装へ直接依存しない
- **WHEN** `apps/backend` の import 依存を検査する
- **THEN** `apps/batch` 配下のソースへ直接 import してはならず、共有コードは `packages/*` 経由で参照しなければならない

#### Scenario: batch が backend の実装へ直接依存しない
- **WHEN** `apps/batch` の import 依存を検査する
- **THEN** `apps/backend` 配下のソースへ直接 import してはならず、共有コードは `packages/*` 経由で参照しなければならない

### Requirement: DB 資産と運用資産はアプリコードから分離される
The system MUST isolate database assets under `db/` and operational assets under `infra/`, and these directories MUST NOT be treated as runnable applications.

#### Scenario: DB 資産が専用ディレクトリに集約される
- **WHEN** マイグレーション、Drizzle成果物、seed の配置を確認する
- **THEN** それらは `db/` 配下に存在し、`apps/*` 配下に混在してはならない

#### Scenario: インフラ資産が専用ディレクトリに集約される
- **WHEN** compose や env テンプレート等の運用資産を確認する
- **THEN** それらは `infra/` 配下に存在し、`apps/*` 配下に混在してはならない

### Requirement: レイアウト移行は API 契約を変更せずに実施される
The system MUST preserve existing external API contract behavior while applying the repository layout split in this change.

#### Scenario: 既存 API エンドポイント契約が維持される
- **WHEN** レイアウト変更後に API 契約テストを実行する
- **THEN** 既存エンドポイントのリクエスト/レスポンス契約は変更されてはならない

### Requirement: ローカル実行手順は移行後も維持される
The system MUST provide documented local run commands for backend and frontend after runtime entrypoint consolidation and those commands MUST resolve to `apps/*` targets.

#### Scenario: backend をローカル起動できる
- **WHEN** 開発者が README の手順に従って backend 起動コマンドを実行する
- **THEN** `apps/backend` を実行対象として backend はローカルで起動できなければならない

#### Scenario: frontend をローカル起動できる
- **WHEN** 開発者が README の手順に従って frontend 起動コマンドを実行する
- **THEN** `apps/frontend` を実行対象として frontend はローカルで起動できなければならない

### Requirement: 設計ドキュメントは新レイアウトに同期される
The system MUST update architecture and developer documentation to reflect the new repository layout and boundaries.

#### Scenario: architecture ドキュメントが新構成を示す
- **WHEN** 開発者が architecture ドキュメントを参照する
- **THEN** `apps` `packages` `db` `infra` の責務と依存境界が明記されていなければならない

#### Scenario: Docker 化が本 change から除外されることが明記される
- **WHEN** 開発者が本 change の docs を参照する
- **THEN** Dockerfile や `compose.yml` は次 change の対象であることが明記されていなければならない

