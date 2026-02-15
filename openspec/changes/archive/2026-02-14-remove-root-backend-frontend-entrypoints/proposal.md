## Why

現在は `apps/*` と ルート直下 `backend` / `frontend` が併存しており、実行入口と責務境界が分かりづらい。まず「公式な実行入口を `apps/*` に一本化」し、以降の backend-first リファクタの前提を整える必要がある。

## What Changes

- 実行・開発の公式入口を `apps/backend` `apps/frontend` `apps/batch` に統一する。
- ルート `package.json` scripts、CI、README の参照を `apps/*` 基準に切り替える。
- ルート直下 `backend` / `frontend` は互換ラッパー（移行期間）に縮退し、新規実装の追加を禁止する。
- API/Batch/Frontend の外部契約は変更しない（挙動互換を維持）。
- 次 change で `apps/backend/features/*` を正規の feature 所有境界とするため、旧導線参照を棚卸しする。

### 全体ロードマップ内での位置づけ

- Phase 1（本 change）: 入口統一と互換縮退
- Phase 2: backend-first feature 再配置（`apps/backend/features/*`）
- Phase 3: `apps/common` への選択的抽出と境界ルール強制
- Phase 4: 互換層の除去と最終クリーンアップ

## Capabilities

### New Capabilities

- `app-entrypoint-consolidation`: 実行入口を `apps/*` に集約し、移行期間の互換運用を定義する

### Modified Capabilities

- `application-runtime-layout`: ルート直下アプリを公式レイアウトから外し、`apps/*` を唯一の実行入口として扱う要件へ更新する

## Impact

- Affected code: ルート scripts、CI workflow、README、`backend`/`frontend` の起動・テスト入口
- APIs: 変更なし（HTTP契約維持）
- Dependencies: 追加なし（参照パス・実行導線の変更が中心）
- Systems: CI 実行導線、ローカル開発手順
