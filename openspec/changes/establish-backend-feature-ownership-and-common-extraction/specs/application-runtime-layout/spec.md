## MODIFIED Requirements

### Requirement: 共有コードは packages 経由で利用される
The system MUST keep backend feature ownership under `apps/backend/features/*`, MUST place only cross-app reusable code under `apps/common/*`, and MUST prevent direct app-to-app source dependency.

#### Scenario: backend が batch の実装へ直接依存しない
- **WHEN** `apps/backend` の import 依存を検査する
- **THEN** `apps/batch` 配下のソースへ直接 import してはならない

#### Scenario: batch が backend の HTTP 実装へ直接依存しない
- **WHEN** `apps/batch` の import 依存を検査する
- **THEN** `apps/backend/interface` 配下のソースへ直接 import してはならず、再利用は `apps/common/*` 経由でなければならない

#### Scenario: 共通化対象は cross-app 利用時のみ抽出される
- **WHEN** 開発者が `apps/common` 配下へ実装を追加する
- **THEN** その実装は複数 app で利用されることが確認されなければならない

### Requirement: 設計ドキュメントは新レイアウトに同期される
The system MUST update architecture and developer documentation to reflect backend-first ownership and `apps/common` selective extraction boundaries.

#### Scenario: architecture ドキュメントが backend/common 境界を示す
- **WHEN** 開発者が architecture ドキュメントを参照する
- **THEN** `apps/backend/features/*` が機能所有境界であり、`apps/common/*` は最小共有境界であることが明記されていなければならない

#### Scenario: Docker 化が本 change から除外されることが明記される
- **WHEN** 開発者が本 change の docs を参照する
- **THEN** Dockerfile や `compose.yml` は次 change の対象であることが明記されていなければならない
