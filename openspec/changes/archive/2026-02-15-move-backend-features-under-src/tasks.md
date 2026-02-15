## 1. Contract Test First (Red)

- [x] 1.1 `backend/tests/contracts/feature-ownership-boundary.test.ts` の feature 所有境界を `apps/backend/src/features/*` 前提に更新し、失敗を確認する
- [x] 1.2 レイアウト参照を持つ関連テストが `apps/backend/features/*` をハードコードしていないかを検査し、必要な失敗ケースを追加する

## 2. Backend Feature Relocation (Green)

- [x] 2.1 `apps/backend/features/*` を `apps/backend/src/features/*` へ移動する
- [x] 2.2 `apps/backend/src/*` と feature 内 import の旧パス参照を新パスへ更新する
- [x] 2.3 `apps/backend/tsconfig.json` の `include` 等を新ディレクトリ構成に合わせて更新する

## 3. Spec/Docs Alignment

- [x] 3.1 `docs/architecture.md` の backend feature 所有境界の記述を `apps/backend/src/features/*` に更新する
- [x] 3.2 OpenSpec change artifacts（本 change）と実装結果の整合を確認する

## 4. Verification

- [x] 4.1 `bun run --filter oss-health-checker-backend typecheck` を実行して成功させる
- [x] 4.2 `bunx vitest run backend/tests/contracts/feature-ownership-boundary.test.ts backend/tests/contracts/app-layout-boundary.test.ts` を実行して成功させる
- [x] 4.3 `bun run --filter oss-health-checker-backend test` を実行して回帰がないことを確認する
