## 1. API契約と状態モデルの確定

- [ ] 1.1 adoption DTO（`mappingStatus` / `adoptionFetchStatus` / adoption fields）を OpenAPI に追加し、truth table の許可組み合わせのみ表現できる schema を定義する
- [ ] 1.2 backend の zod/runtime schema を OpenAPI 契約と一致させ、`not_mapped/not_applicable` 時の null 許容を明示する
- [ ] 1.3 frontend の model schema を更新し、API 契約との差分がないことを型・バリデーションテストで確認する

## 2. 永続化と移行の実装

- [ ] 2.1 repository-package mapping と adoption snapshot のテーブル/エンティティ追加に対する失敗テストを先に作成する
- [ ] 2.2 repository-package mapping と adoption snapshot のテーブル/エンティティを追加する Drizzle schema を実装する
- [ ] 2.3 migration を作成し、既存データに影響しない nullable/default 方針で適用できることを確認する
- [ ] 2.4 mapping/snapshot の repository port の失敗テストを先に作成する
- [ ] 2.5 mapping/snapshot の repository port 実装を追加し、取得・保存・最新値参照の振る舞いを満たす

## 3. Backend adoption feature の実装

- [ ] 3.1 `features/ecosystem-adoption` の use-case/ports に対する失敗テストを先に作成する
- [ ] 3.2 `features/ecosystem-adoption` の domain/application/use-case/ports を作成し、provider 解決を `RegistryProviderResolverPort` 経由にする
- [ ] 3.3 npm provider adapter の失敗テストを先に作成する
- [ ] 3.4 npm provider adapter を実装し、downloads/version/published 情報を内部モデルへ正規化する
- [ ] 3.5 取得失敗時に前回成功 snapshot を保持したまま `adoptionFetchStatus="failed"` を返すユースケースの失敗テストを先に作成する
- [ ] 3.6 取得失敗時に前回成功 snapshot を保持したまま `adoptionFetchStatus="failed"` を返すユースケースを実装する
- [ ] 3.7 repository 一覧 read model 統合の失敗テストを先に作成し、mapped/succeeded・mapped/failed・not_mapped/not_applicable の全状態を検証する
- [ ] 3.8 repository 一覧 read model に adoption を統合し、3状態を返す
- [ ] 3.9 `interface/http/error-mapper.ts` を実装し、ApplicationError から HTTP エラーコードへの変換契約を定義する
- [ ] 3.10 error-mapper の契約テストを追加し、主要エラーコード変換の一貫性を検証する
- [ ] 3.11 adoption provider の有効/無効を制御する設定（feature flag または provider disable 設定）を追加する
- [ ] 3.12 provider 無効時に adoption を安全にスキップし既存 Dev Health を維持する挙動を実装・テストする
- [ ] 3.13 `shared/bootstrap/build-container.ts` で provider registry/resolver と設定値を配線し、`shared/bootstrap/build-app.ts` で route/controller を公開する

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
