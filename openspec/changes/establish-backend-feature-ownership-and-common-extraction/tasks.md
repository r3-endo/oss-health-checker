## 1. 事前ガード（Red）

- [x] 1.1 `apps/backend/features/*` を feature 所有境界として検証する失敗テストを追加する
- [x] 1.2 `packages/common` への追加は cross-app 再利用時のみ許可する失敗テストを追加する
- [x] 1.3 `apps/batch` から `apps/backend/interface/*` 直接 import 禁止を検証する失敗テストを追加する

## 2. backend-first 再配置（Green）

- [x] 2.1 `development-health` の interface/http を `apps/backend/features/development-health` へ再配置する
- [x] 2.2 `ecosystem-adoption` の interface/http を `apps/backend/features/ecosystem-adoption` へ再配置する
- [x] 2.3 `dashboard-overview` 実装を丸ごと `apps/backend/features/dashboard-overview` へ再配置する
- [x] 2.4 `build-container.ts` / `build-app.ts` を `apps/backend/src/` へ移動する
- [x] 2.5 `apps/backend` エントリポイント (`app.ts`) の import を新配置へ更新する
- [x] 2.6 backend テストの import パスを新配置へ更新する（38 ファイル 184 テスト全通過確認済み）
- [x] 2.7 packages/common の exports map を bun 1.3.9 互換に修正する（`./*.js` → `./src/*.ts` 追加）

## 3. 選択的 common 抽出

- [x] 3.1 batch と backend の両方で利用する最小要素を `packages/common` に維持する（shared / feature の application・domain・infrastructure 層）
- [x] 3.2 `apps/batch` の import が `packages/common` 経由であることを確認する
- [x] 3.3 backend 専用実装が `packages/common` に残っていないことを確認する
  - HTTP interface 層・Composition Root は移動完了
  - backend 専用の application use-cases / read-models / ports / infrastructure adapters 約 29 ファイルが残存 → 次 change（`enforce-backend-common-boundaries`）で対応

## 4. 設定・導線更新

- [x] 4.1 `apps/backend/tsconfig.json` に `features` ディレクトリを include 追加する
- [x] 4.2 CI workflow の path filter を確認する（`apps/backend/**` で features/ を自動カバー → 変更不要）
- [x] 4.3 `docs/architecture.md` に backend-first と selective extraction の境界を反映する

## 5. 最終検証

- [x] 5.1 `bun run --filter oss-health-checker-backend typecheck` / `lint` / `test` を通す（38 ファイル 184 テスト全通過）
- [x] 5.2 `bun run batch:snapshots` / `batch:adoption` の実行導線を検証する（正常動作確認済み）
- [x] 5.3 API 契約テストを実行し、外部挙動が変わらないことを確認する（全契約テスト通過）
- [x] 5.4 次 change（`enforce-backend-common-boundaries`）へ引き継ぐ TODO を整理する

## 次 change への引き継ぎ TODO

以下は本 change の scope 外として次 change で対応する:

### backend 専用ファイルの packages/common からの移動（約 29 ファイル）

**development-health（22 ファイル）:**
- application/use-cases: 5 ファイル（get-category-detail, list-category-summaries, list-repositories-with-latest-snapshot, register-repository, refresh-repository）
- application/read-models: 3 ファイル
- application/services: 2 ファイル（github-repository-url, snapshot-factory）
- application/ports: 6 ファイル（category-read, category-repository-facts, registry-data, repository-read-model, repository-snapshot-read, unit-of-work）
- infrastructure/repositories: 6 ファイル（category-read, registry-data, repository-read-model, repository-snapshot-read, snapshot, unit-of-work adapters）

**ecosystem-adoption（7 ファイル）:**
- application/use-cases: 2 ファイル（get-repository-adoption, refresh-repository-adoption）
- application/read-models: 1 ファイル
- application/services: 1 ファイル（adoption-score-calculator）
- application/ports: 1 ファイル（repository-adoption-read）
- infrastructure/repositories: 1 ファイル（drizzle-repository-adoption-read-adapter）
- infrastructure/repositories: 1 ファイル（persisted-adoption-validation — 部分共有）
