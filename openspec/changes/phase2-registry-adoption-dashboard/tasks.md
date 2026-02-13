## 1. API契約と状態モデルの確定

- [x] 1.1 adoption DTO（`mappingStatus` / `adoptionFetchStatus` / adoption fields）を OpenAPI に追加し、truth table の許可組み合わせのみ表現できる schema を定義する
- [x] 1.2 backend の zod/runtime schema を OpenAPI 契約と一致させ、`not_mapped/not_applicable` 時の null 許容を明示する
- [x] 1.3 frontend の model schema を更新し、API 契約との差分がないことを型・バリデーションテストで確認する

## 2. 永続化と移行の実装

- [x] 2.1 repository-package mapping と adoption snapshot のテーブル/エンティティ追加に対する失敗テストを先に作成する
- [x] 2.2 repository-package mapping と adoption snapshot のテーブル/エンティティを追加する Drizzle schema を実装する
- [x] 2.3 migration を作成し、既存データに影響しない nullable/default 方針で適用できることを確認する
- [x] 2.4 mapping/snapshot の repository port の失敗テストを先に作成する
- [x] 2.5 mapping/snapshot の repository port 実装を追加し、取得・保存・最新値参照の振る舞いを満たす

## 3. Backend adoption feature の実装

- [x] 3.1 `features/ecosystem-adoption` の use-case/ports に対する失敗テストを先に作成する
- [x] 3.2 `features/ecosystem-adoption` の domain/application/use-case/ports を作成し、provider 解決を `RegistryProviderResolverPort` 経由にする
- [x] 3.3 npm provider adapter の失敗テストを先に作成する
- [x] 3.4 npm provider adapter を実装し、downloads/version/published 情報を内部モデルへ正規化する
- [x] 3.5 取得失敗時に前回成功 snapshot を保持したまま `adoptionFetchStatus="failed"` を返すユースケースの失敗テストを先に作成する
- [x] 3.6 取得失敗時に前回成功 snapshot を保持したまま `adoptionFetchStatus="failed"` を返すユースケースを実装する
- [x] 3.7 repository 一覧 read model 統合の失敗テストを先に作成し、mapped/succeeded・mapped/failed・not_mapped/not_applicable の全状態を検証する
- [x] 3.8 repository 一覧 read model に adoption を統合し、3状態を返す
- [x] 3.9 `interface/http/error-mapper.ts` を実装し、ApplicationError から HTTP エラーコードへの変換契約を定義する
- [x] 3.10 error-mapper の契約テストを追加し、主要エラーコード変換の一貫性を検証する
- [x] 3.11 adoption provider の有効/無効を制御する設定（feature flag または provider disable 設定）を追加する
- [x] 3.12 provider 無効時に adoption を安全にスキップし既存 Dev Health を維持する挙動を実装・テストする
- [x] 3.13 `shared/bootstrap/build-container.ts` で provider registry/resolver と設定値を配線し、`shared/bootstrap/build-app.ts` で route/controller を公開する

## 4. Frontend dashboard の拡張

- [ ] 4.1 repositories API adapter と query hooks の失敗テストを先に作成する
- [ ] 4.2 repositories API adapter と query hooks を更新し、adoption フィールドと状態モデルを UI に渡す
- [ ] 4.3 テーブル列追加の表示テストを先に作成する
- [ ] 4.4 テーブルに adoption 列（Package Name, Weekly Downloads, Δ7d, Δ30d, Last Published Date, Latest Version）を追加する
- [ ] 4.5 `mappingStatus="not_mapped"` 表示の失敗テストを先に作成する
- [ ] 4.6 `mappingStatus="not_mapped"` 時に `Not Mapped` を表示する分岐を実装する
- [ ] 4.7 `adoptionFetchStatus="failed"` 表示の失敗テストを先に作成する
- [ ] 4.8 `adoptionFetchStatus="failed"` 時に前回値を維持しつつ更新失敗フィードバックを表示する

## 5. TDD・失敗系テスト・CI確認

- [ ] 5.1 backend の失敗系テスト（not_mapped、provider failure、null/欠損値、provider disabled）を網羅的に実行する
- [ ] 5.2 frontend の表示テストで 3状態（mapped/succeeded、mapped/failed、not_mapped/not_applicable）と provider disabled 時の描画を検証する
- [ ] 5.3 `bun install` と `bun run` のプロジェクト標準チェックを実行し、変更一式が CI 品質ゲートを満たすことを確認する

## 6. 集約境界分離リファクタ（影響局所化）

- [x] 6.1 `dashboard-overview` の統合 read model 契約（Dev Health + Adoption）を OpenAPI に追加する失敗テストを先に作成する
- [x] 6.2 backend に `features/dashboard-overview`（application/ports/use-case/interface）を作成し、`/api/dashboard/repositories` を公開する
- [x] 6.3 `dashboard-overview` の read model 統合テストを追加し、3状態（mapped/succeeded・mapped/failed・not_mapped/not_applicable）と既存 Dev Health 項目の同時返却を検証する
- [x] 6.4 `shared/bootstrap/build-container.ts` で `dashboard-overview` 専用の read port 配線を追加し、既存 feature から join ロジックを剥離する
- [x] 6.5 frontend に `features/dashboard`（api/model/hooks/ui）を新設する失敗テストを先に作成する
- [x] 6.6 frontend `features/dashboard` で `/api/dashboard/repositories` を利用する adapter/query を実装し、既存 `features/repositories` から統合表示責務を移す
- [x] 6.7 dashboard テーブル表示テストを追加し、adoption 列・Not Mapped・更新失敗表示が `features/dashboard` 単体で成立することを検証する
- [x] 6.8 移行完了後、`development-health` の repository list read model から adoption 統合を除去する失敗テストを先に作成する
- [x] 6.9 `development-health` を Dev Health 専用レスポンスへ戻し、後方互換の必要性を確認した上で deprecation 方針を `proposal/design` に反映する
- [x] 6.10 backend/frontend の契約テスト・結合テストを更新し、feature 単位で変更影響が閉じることを CI で確認する

## 7. 画面分離（ハブ + GitHub + Registry）への移行

- [x] 7.1 `Dashboard` ハブ画面の要件（遷移導線・サマリ表示）に対する失敗テストを先に作成する
- [x] 7.2 frontend ルーティングを導入し、`/` をハブ、`/github` を既存 GitHub Health、`/registry` を Registry Adoption に割り当てる
- [x] 7.3 `GitHub Health` 画面で既存 `LLM / backend / frontend` カテゴリUIが維持されることを検証する失敗テストを先に作成する
- [x] 7.4 `GitHub Health` 画面から adoption 列依存を除去し、Dev Health 表示に責務を限定する
- [x] 7.5 `Registry Adoption` 画面の一覧表示（Package Name / Weekly Downloads / Δ7d / Δ30d / Last Published Date / Latest Version）の失敗テストを先に作成する
- [x] 7.6 `Registry Adoption` 画面で `Not Mapped` と `Update failed` 表示を実装し、前回値保持の描画を確認する
- [x] 7.7 ハブ画面から `GitHub Health` と `Registry Adoption` の双方へ遷移できることを UI テストで検証する
- [x] 7.8 ナビゲーション導線（戻る/相互リンク）を追加し、3画面間の往復操作を E2E または統合テストで検証する
- [x] 7.9 API 契約テストを更新し、`GitHub Health` は Dev Health 専用、`Registry Adoption` は統合 adoption 表示を利用する境界を固定する
- [x] 7.10 画面分離後の受け入れシナリオ（情報過密回避・目的別導線）を `specs` とテストに反映し、CI で回帰がないことを確認する
