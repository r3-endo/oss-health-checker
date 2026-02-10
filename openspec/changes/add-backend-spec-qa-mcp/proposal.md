## Why

Backend の実装から仕様Q&Aを行いたいが、現状はコード調査が手作業で、判断根拠の再現性と共有性が低い。まずは IDE/エージェント連携で使える MCP ベースの最小機能を作り、ビジネスロジックに関する質問へ根拠付きで回答できる状態を早期に作る。

## What Changes

- Backend コードを一次根拠として、ビジネスロジック質問に回答する MCP 向け QA 機能を追加する。
- 回答は `answer` に加えて、`evidence`（コードの `path:line` と対応する spec 参照）、`confidence`、`unknowns` を返す。
- コードと Spec が不一致の場合でも回答は返し、`spec_mismatch=true` を明示して警告を返す。
- MVP では対象を backend に限定し、実行時データ依存の質問（DB実データや外部APIの現在値）は非対応とする。

## Capabilities

### New Capabilities

- `backend-logic-qa-mcp`: Backend 実装を根拠にビジネスロジックのQ&Aを行い、根拠参照と仕様不一致フラグを返す。

### Modified Capabilities

- なし

## Impact

- Affected code:
  - Backend の MCP ツール実装領域（新規ツール追加）
  - Backend のロジック探索/根拠抽出レイヤー
- APIs:
  - MCP 経由で公開する QA ツールインターフェース（入力: 質問、出力: 構造化回答）
- Specs:
  - `openspec/changes/add-backend-spec-qa-mcp/specs/backend-logic-qa-mcp/spec.md` を新規作成予定
- Dependencies/Systems:
  - ローカルコードベース参照機構（検索/参照解決）
  - 既存 OpenSpec 運用（Spec との差分警告フロー）
