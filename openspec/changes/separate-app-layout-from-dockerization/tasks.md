## 1. PR-1: 事前ガードとワークスペース基盤

- [ ] 1.1 新レイアウト必須ディレクトリ（`apps/*` `packages/*` `db` `infra`）を検証する失敗テストを追加する
- [ ] 1.2 app 間直接 import 禁止（`apps/backend -> apps/batch` と `apps/batch -> apps/backend`）を検証する失敗テストを追加する
- [ ] 1.3 既存 API 契約テストのベースラインを記録する
- [ ] 1.4 ルート `package.json` に workspace 設定と統一実行スクリプト（typecheck/lint/test）を定義する
- [ ] 1.5 ルート `tsconfig` に path alias（`@common/*`）を追加する
- [ ] 1.6 互換期間の旧コマンド委譲スクリプトを追加する
- [ ] 1.7 `bun run typecheck` `bun run lint` `bun run test` を通す
- [ ] 1.8 PR-1 を作成する（範囲: テスト/基盤のみ）

## 2. PR-2: apps 分離と共有コード境界固定

- [ ] 2.1 `apps/backend` に API エントリポイントと関連設定を移動する
- [ ] 2.2 `apps/batch` に `collect-daily-snapshots` と `collect-daily-adoption-snapshots` のエントリポイントを移動する
- [ ] 2.3 `apps/frontend` にプレースホルダ（README または最小雛形）を作成する
- [ ] 2.4 共有コードを `packages/common` へ移動する
- [ ] 2.5 `apps/backend` と `apps/batch` の import を package alias 参照へ置換する
- [ ] 2.6 app 間直接依存を検出する境界テスト/ルールを更新する
- [ ] 2.7 追加したテストを Green 化する
- [ ] 2.8 PR-2 を作成する（範囲: apps/packages 移行）

## 3. PR-3: db/infra 分離と実行系更新

- [ ] 3.1 Drizzle 関連資産（migration/meta/config 参照）を `db/` 配下へ移動する
- [ ] 3.2 seed/migrate 実行コマンドを `db/` 新パスに合わせて更新する
- [ ] 3.3 `infra/` ディレクトリ骨格（compose/env/scripts）を作成する
- [ ] 3.4 CI コマンドと参照パスを新レイアウトへ更新する
- [ ] 3.5 `bun run typecheck` `bun run lint` `bun run test` を通す
- [ ] 3.6 PR-3 を作成する（範囲: db/infra と実行コマンド）

## 4. PR-4: ドキュメント確定と最終検証

- [ ] 4.1 ルート `README.md` に新レイアウトとローカル実行コマンドを追記/更新する
- [ ] 4.2 `docs/architecture.md` に `apps/packages/db/infra` 境界と依存方向を追記/更新する
- [ ] 4.3 Docker 化が次 change 範囲であることを README と OpenSpec artifacts に明記する
- [ ] 4.4 API 契約テストを含む全テストを最終実行する
- [ ] 4.5 変更差分に Dockerfile / `compose.yml` 実装が含まれていないことを確認する
- [ ] 4.6 PR-4 を作成する（範囲: docs と最終確認）
