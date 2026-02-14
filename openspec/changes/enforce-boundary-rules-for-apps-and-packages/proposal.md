## Why

レイアウト変更だけでは時間経過で依存境界が再び崩れる。`apps/*` と `packages/*` の依存方向、batch の責務境界を機械的に検証し、継続的に守れる状態へ固定する必要がある。

## What Changes

- app 間直接依存禁止、feature package 間の許可方向、batch の非HTTP依存を contract test/lint rule で定義する。
- 禁止 import パターン（例: `apps/batch -> apps/backend`、`batch -> interface/http`）を明文化し検出テストを追加する。
- ルール逸脱時に CI が即時失敗するよう quality gate に統合する。
- ルール導入による実行契約変更は行わない（検証追加のみ）。

### 全体ロードマップ内での位置づけ

- Phase 1: 入口統一と互換縮退
- Phase 2: package の feature 分割
- Phase 3（本 change）: 依存境界の機械的固定
- Phase 4: 互換層の除去と最終クリーンアップ

## Capabilities

### New Capabilities

- `dependency-boundary-enforcement`: apps/packages の依存境界をテスト・lint で継続検証する能力

### Modified Capabilities

- `application-runtime-layout`: 依存境界を「推奨」から「CI で強制」へ要件更新する
- `transactional-use-case-boundary`: batch/backend のユースケース依存で禁止境界を追加する

## Impact

- Affected code: contract tests、lint rules、CI quality gate
- APIs: 変更なし
- Dependencies: ルール検証用の設定変更（必要に応じ lint 設定追加）
- Systems: CI 失敗条件の追加
