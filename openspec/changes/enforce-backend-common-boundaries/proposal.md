## Why

backend-first へ再配置しただけでは、時間経過で `backend` と `common` の責務境界が崩れる。`apps/backend/features/*` と `apps/common/*` の依存方向、batch の責務境界を機械的に検証し、継続的に守れる状態へ固定する必要がある。

## What Changes

- `apps/backend/features/*` は機能所有、`apps/common/*` は再利用核のみというルールを contract test/lint rule で定義する。
- 禁止 import パターン（例: `apps/batch -> apps/backend/interface/http`、`apps/common -> apps/backend`）を明文化し検出テストを追加する。
- 「共有必要性がある実装のみ common へ抽出」の判定基準を docs とテスト観点に定義する。
- ルール逸脱時に CI が即時失敗するよう quality gate に統合する。

### 全体ロードマップ内での位置づけ

- Phase 1: 入口統一と互換縮退
- Phase 2: backend-first feature 再配置
- Phase 3（本 change）: `backend/common` 境界の機械的固定
- Phase 4: 互換層の除去と最終クリーンアップ

## Capabilities

### New Capabilities

- `backend-common-boundary-enforcement`: `apps/backend` と `apps/common` の依存境界をテスト・lint で継続検証する能力

### Modified Capabilities

- `application-runtime-layout`: 共有境界を「推奨」から「CI で強制」へ更新する
- `transactional-use-case-boundary`: batch/backend のユースケース依存で禁止境界を追加する

## Impact

- Affected code: contract tests、lint rules、CI quality gate
- APIs: 変更なし
- Dependencies: ルール検証用の設定変更（必要に応じ lint 設定追加）
- Systems: CI 失敗条件の追加
