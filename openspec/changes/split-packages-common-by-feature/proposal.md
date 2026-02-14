## Why

`packages/common` に複数 feature が集約され過ぎており、変更影響範囲の見通しが悪い。feature 単位の package 分割により、依存境界を明確化し、backend/batch の再利用を安全にする必要がある。

## What Changes

- `packages/common` を feature 単位に分割する（例: `packages/development-health`, `packages/ecosystem-adoption`, `packages/dashboard-overview`）。
- 共通基盤を `packages/shared-kernel` / `packages/platform-db` などの責務別 package に分離する。
- `apps/backend` と `apps/batch` の import を新 package 名へ段階置換する。
- 既存 API 契約および batch の実行結果を変えない（構造変更のみ）。
- `packages/common` は互換エクスポート層として一時維持し、次段階で削除可能にする。

### 全体ロードマップ内での位置づけ

- Phase 1: 入口統一と互換縮退
- Phase 2（本 change）: package の feature 分割
- Phase 3: 境界ルールの強制
- Phase 4: 互換層の除去と最終クリーンアップ

## Capabilities

### New Capabilities

- `feature-package-segmentation`: feature/基盤を package 単位に分離し、利用者（apps）から明示参照できる能力

### Modified Capabilities

- `application-runtime-layout`: 共有コード参照の標準経路を `packages/common` 単体から feature 単位 package 群へ更新する
- `repository-signal-ingestion`: batch が利用する実装依存を feature package 経由へ切り替える

## Impact

- Affected code: `packages/common` 配下構成、`apps/backend` / `apps/batch` import、workspace 設定
- APIs: 変更なし（外部契約維持）
- Dependencies: workspace package 追加（実質は内部分割）
- Systems: typecheck/lint/test の参照解決と build graph
