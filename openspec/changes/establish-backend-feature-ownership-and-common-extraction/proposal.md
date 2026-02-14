## Why

現状の共有実装は「共通化」前提で配置されており、機能の所有者（backend）と再利用対象（batch）の境界が曖昧になりやすい。まず `apps/backend/features/*` を正規配置にし、複数 app で必要な実装だけを `apps/common` に抽出する backend-first 方針へ切り替える必要がある。

## What Changes

- feature 実装の正規配置を `apps/backend/features/*` に統一する。
- `apps/common` はライブラリ/複数 app 共有要素のみを置く最小境界として定義する。
- batch が必要とする処理は backend feature から段階的に `apps/common` へ抽出する（selective extraction）。
- import 経路を backend-first 方針へ置換し、共有必要性がない実装は common へ入れない。
- API 契約および batch の実行結果は変更しない。

### 全体ロードマップ内での位置づけ

- Phase 1: 入口統一と互換縮退
- Phase 2（本 change）: backend-first feature 再配置
- Phase 3: `apps/common` への選択的抽出と境界ルール強制
- Phase 4: 互換層の除去と最終クリーンアップ

## Capabilities

### New Capabilities

- `backend-feature-ownership`: feature 実装の一次所有を `apps/backend/features/*` に固定する

### Modified Capabilities

- `application-runtime-layout`: 共有コード境界を `packages/common` 前提から `apps/common` 最小共有境界へ更新する
- `repository-signal-ingestion`: batch が利用する処理を backend 所有から選択的に共通抽出する要件へ更新する

## Impact

- Affected code: feature 配置（backend/common）、import 経路、workspace 設定
- APIs: 変更なし（外部契約維持）
- Dependencies: 追加なし（配置と依存方向の整理が中心）
- Systems: typecheck/lint/test の参照解決と build graph
