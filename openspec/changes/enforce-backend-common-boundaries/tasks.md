## 1. 境界ガードの追加（Red）

- [ ] 1.1 `apps/batch -> apps/backend/interface/*` 禁止依存を検出する失敗テストを追加する
- [ ] 1.2 `apps/common -> apps/backend/*` 禁止依存を検出する失敗テストを追加する
- [ ] 1.3 `apps/common` 追加時に cross-app 利用証跡を要求する失敗テストを追加する

## 2. backend 専用実装の再配置（Green）

- [ ] 2.1 development-health の backend 専用 22 ファイルを `apps/backend/features/development-health` へ移動する
- [ ] 2.2 ecosystem-adoption の backend 専用 7 ファイルを `apps/backend/features/ecosystem-adoption` へ移動する
- [ ] 2.3 移動後の import パスと composition root 参照を更新してテストを Green にする

## 3. common 境界の最小化

- [ ] 3.1 `apps/common` に残す対象を batch/backend 共有契約に限定する
- [ ] 3.2 batch の利用導線が `apps/common` 経由であることを確認する
- [ ] 3.3 backend 専用 use-case/read-model/port/adapter が `apps/common` に残っていないことを確認する

## 4. Quality Gate 統合

- [ ] 4.1 境界検証を lint/contract test の実行導線に統合する
- [ ] 4.2 CI で境界違反時に即失敗するよう workflow を更新する
- [ ] 4.3 `docs/architecture.md` に backend/common の強制境界と判定基準を反映する

## 5. 最終検証

- [ ] 5.1 `bun run --filter oss-health-checker-backend typecheck` / `lint` / `test` を通す
- [ ] 5.2 `bun run batch:snapshots` / `bun run batch:adoption` の実行導線を検証する
- [ ] 5.3 API 契約テストを実行し、外部挙動が不変であることを確認する
