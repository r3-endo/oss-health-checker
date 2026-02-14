## 1. 導線統一の事前ガード

- [ ] 1.1 `apps/*` が正式実行入口であることを検証する契約テストを追加する（旧 `backend`/`frontend` を正式入口として扱わない検証を含む）
- [ ] 1.2 API 契約テストのベースラインを記録し、入口統一で挙動が変わらないことを確認する
- [ ] 1.3 旧 `backend`/`frontend` 配下への新規実装混入を検知するレビュー/テスト観点を追加する

## 2. 実行導線の統一実装

- [ ] 2.1 ルート `package.json` scripts を `apps/backend` `apps/frontend` `apps/batch` 実行へ統一する
- [ ] 2.2 CI workflow の実行コマンドと path 参照を `apps/*` 中心に更新する
- [ ] 2.3 README の setup/run/quality コマンドを `apps/*` 入口へ統一する
- [ ] 2.4 `apps/frontend` から `bun run frontend:dev` / test が成立するよう、現行実体の移送または互換委譲を実装する
- [ ] 2.5 `apps/backend` から API 起動・契約テストが成立するよう、旧導線依存を削減または互換委譲する

## 3. 互換レイヤー縮退

- [ ] 3.1 ルート直下 `backend`/`frontend` を互換用途に限定する方針を明記する（README または各ディレクトリ注記）
- [ ] 3.2 旧導線参照（scripts/workflows/docs）を棚卸しし、必要な委譲のみ残す
- [ ] 3.3 旧導線へ新規機能を追加しない運用ルールを docs に反映する

## 4. 最終検証

- [ ] 4.1 `bun run typecheck` `bun run lint` `bun run test` を通す
- [ ] 4.2 `bun run --filter oss-health-checker-backend test:openapi-contract` を通す
- [ ] 4.3 変更差分に API 振る舞い変更がないことを確認する
- [ ] 4.4 次 change（`split-packages-common-by-feature`）へ引き継ぐ TODO を整理する
