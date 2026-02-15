## MODIFIED Requirements

### Requirement: リポジトリは実行アプリ単位でディレクトリ分離される
The system MUST separate runnable applications under `apps/` as `apps/frontend`, `apps/backend`, and `apps/batch`, and MUST treat these directories as the only canonical runtime entrypoints.

#### Scenario: 実行アプリの配置が規約に一致する
- **WHEN** 開発者がリポジトリ構成を確認する
- **THEN** 実行可能アプリは `apps/frontend` `apps/backend` `apps/batch` に配置されていなければならない

#### Scenario: ルート直下 app は正式実行入口として扱われない
- **WHEN** 開発者が起動・テスト・CI の実行入口を確認する
- **THEN** `backend` および `frontend` 直下は正式入口として扱われず、`apps/*` が唯一の実行入口でなければならない

### Requirement: ローカル実行手順は移行後も維持される
The system MUST provide documented local run commands for backend and frontend after runtime entrypoint consolidation and those commands MUST resolve to `apps/*` targets.

#### Scenario: backend をローカル起動できる
- **WHEN** 開発者が README の手順に従って backend 起動コマンドを実行する
- **THEN** `apps/backend` を実行対象として backend はローカルで起動できなければならない

#### Scenario: frontend をローカル起動できる
- **WHEN** 開発者が README の手順に従って frontend 起動コマンドを実行する
- **THEN** `apps/frontend` を実行対象として frontend はローカルで起動できなければならない
