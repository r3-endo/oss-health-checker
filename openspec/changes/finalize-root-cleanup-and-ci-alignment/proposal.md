## Why

移行期間の互換層（ルート直下 `backend` / `frontend`）を残すと、将来の実装が混在し再び構造が複雑化する。`apps/*` + `apps/common` の新境界に統一した後、旧導線を物理削除して最終形を確定する必要がある。

## What Changes

- ルート直下 `backend` / `frontend` の互換層を削除し、`apps/*` へ完全統合する。 **BREAKING**
- CI、README、運用手順から旧パス記載を削除し、`apps/*` + `apps/common` 専用へ統一する。
- 一時的な委譲スクリプト・互換 alias を撤去し、不要コードと設定を整理する。
- API 契約テストを含む全テストを最終実行し、移行完了を検証する。

### 全体ロードマップ内での位置づけ

- Phase 1: 入口統一と互換縮退
- Phase 2: backend-first feature 再配置
- Phase 3: `backend/common` 境界の機械的固定
- Phase 4（本 change）: 旧導線削除と最終確定

## Capabilities

### New Capabilities

- `runtime-layout-finalization`: `apps/*` を唯一の実行導線として確定し、旧導線を排除する能力

### Modified Capabilities

- `application-runtime-layout`: 互換期間の記述を終了し、旧ルート直下アプリを非対応とする最終要件へ更新する

## Impact

- Affected code: 旧ディレクトリ削除、CI/README/スクリプト最終調整
- APIs: 変更なし（実行導線のみ変更）
- Dependencies: 削除中心（互換層の撤去）
- Systems: 開発導線と CI 導線の最終一本化
