# app-entrypoint-consolidation Specification

## Purpose
TBD - created by archiving change remove-root-backend-frontend-entrypoints. Update Purpose after archive.
## Requirements
### Requirement: 公式実行入口は apps 配下に統一される
The system MUST treat `apps/backend`, `apps/frontend`, and `apps/batch` as the canonical runtime entrypoints for local development and CI execution.

#### Scenario: ルートコマンドが apps エントリポイントへ解決される
- **WHEN** 開発者または CI がルート実行コマンド（dev/test/lint/typecheck/batch）を実行する
- **THEN** 実行対象は `apps/*` に配置されたエントリポイントへ解決されなければならない

### Requirement: 旧ルート直下 app は互換用途に限定される
The system MUST keep root-level `backend` and `frontend` as compatibility layers only during migration and MUST NOT accept new feature implementation under them.

#### Scenario: 旧ディレクトリに新規実装が追加されない
- **WHEN** 変更差分に `backend` または `frontend` 配下のファイル更新が含まれる
- **THEN** それは互換委譲・説明・移行補助に限定され、機能実装追加であってはならない

### Requirement: 導線統一は API 契約を保持する
The system MUST preserve existing API contracts while consolidating runtime entrypoints under `apps/*`.

#### Scenario: API 契約テストが引き続き成功する
- **WHEN** `apps/*` 入口統一後に API 契約テストを実行する
- **THEN** 既存エンドポイントの契約は変更されず、テストは成功しなければならない

