## 1. 導線統一の事前ガード

- [x] 1.1 `apps/*` が正式実行入口であることを検証する契約テストを追加する（旧 `backend`/`frontend` を正式入口として扱わない検証を含む）
- [x] 1.2 API 契約テストのベースラインを記録し、入口統一で挙動が変わらないことを確認する
- [x] 1.3 旧 `backend`/`frontend` 配下への新規実装混入を検知するレビュー/テスト観点を追加する

## 2. 実行導線の統一実装

- [x] 2.1 ルート `package.json` scripts を `apps/backend` `apps/frontend` `apps/batch` 実行へ統一する
- [x] 2.2 CI workflow の実行コマンドと path 参照を `apps/*` 中心に更新する
- [x] 2.3 README の setup/run/quality コマンドを `apps/*` 入口へ統一する
- [x] 2.4 `apps/frontend` から `bun run frontend:dev` / test が成立するよう、現行実体の移送または互換委譲を実装する
- [x] 2.5 `apps/backend` から API 起動・契約テストが成立するよう、旧導線依存を削減または互換委譲する

## 3. 互換レイヤー縮退

- [x] 3.1 ルート直下 `backend`/`frontend` を互換用途に限定する方針を明記する（README または各ディレクトリ注記）
- [x] 3.2 旧導線参照（scripts/workflows/docs）を棚卸しし、必要な委譲のみ残す
- [x] 3.3 旧導線へ新規機能を追加しない運用ルールを docs に反映する

## 4. 最終検証

- [x] 4.1 `bun run typecheck` `bun run lint` `bun run test` を通す
- [x] 4.2 `bun run --filter oss-health-checker-backend test:openapi-contract` を通す
- [x] 4.3 変更差分に API 振る舞い変更がないことを確認する
- [x] 4.4 次 change（`split-packages-common-by-feature`）へ引き継ぐ TODO を整理する

## 次 change への引き継ぎ TODO

- `frontend/` の実体コード（src/）を `apps/frontend` に移送する（Phase 2-3 で実施）
- `backend/` ディレクトリの物理削除（Phase 4）- テストを別の場所に移動した後
- `frontend/` ディレクトリの物理削除（Phase 4）
- ルート `package.json` workspaces から `backend` `frontend` を除外する（物理削除後）
- CI の `backend/**` path filter を削除する（物理削除後）
