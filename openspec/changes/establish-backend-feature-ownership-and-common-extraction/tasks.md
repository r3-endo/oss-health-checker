## 1. 事前ガード（Red）

- [ ] 1.1 `apps/backend/features/*` を feature 所有境界として検証する失敗テストを追加する
- [ ] 1.2 `apps/common/*` への追加は cross-app 再利用時のみ許可する失敗テストを追加する
- [ ] 1.3 `apps/batch` から `apps/backend/interface/*` 直接 import 禁止を検証する失敗テストを追加する

## 2. backend-first 再配置（Green）

- [ ] 2.1 `development-health` 実装を `apps/backend/features/development-health` へ再配置する
- [ ] 2.2 `ecosystem-adoption` 実装を `apps/backend/features/ecosystem-adoption` へ再配置する
- [ ] 2.3 `dashboard-overview` 実装を `apps/backend/features/dashboard-overview` へ再配置する
- [ ] 2.4 `apps/backend` エントリポイントの import を新配置へ更新する

## 3. 選択的 common 抽出

- [ ] 3.1 batch と backend の両方で利用する最小要素を `apps/common` へ抽出する（shared-kernel / platform-db など）
- [ ] 3.2 `apps/batch` の import を `apps/common` 抽出契約へ置換する
- [ ] 3.3 backend 専用実装が `apps/common` に残っていないことを確認する

## 4. 設定・導線更新

- [ ] 4.1 workspace / tsconfig path alias / eslint ルールを新配置へ更新する
- [ ] 4.2 CI workflow と root scripts の参照先を新配置へ更新する
- [ ] 4.3 README / architecture に backend-first と selective extraction の境界を反映する

## 5. 最終検証

- [ ] 5.1 `bun run typecheck` `bun run lint` `bun run test` を通す
- [ ] 5.2 `bun run batch:snapshots` `bun run batch:adoption` の実行導線を検証する
- [ ] 5.3 API 契約テストを実行し、外部挙動が変わらないことを確認する
- [ ] 5.4 次 change（`enforce-backend-common-boundaries`）へ引き継ぐ TODO を整理する
