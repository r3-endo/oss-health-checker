## 1. 品質ゲートとテスト骨子（Red 先行）

- [x] 1.1 `GET /api/categories` と `GET /api/categories/:slug` のレスポンス契約（nullable 含む）に対する失敗する contract test を追加する
- [x] 1.2 scoreVersion `1` の health score 計算（境界値・clamp）に対する失敗する unit test を追加する
- [x] 1.3 30日計算（基準あり/なし、UTC 日付境界）に対する失敗する unit test を追加する
- [x] 1.4 snapshot 冪等性（同一 repo・同一 UTC 日で upsert）に対する失敗する integration test を追加する
- [x] 1.5 spec -> OpenAPI -> 実レスポンス整合（`CATEGORY_NOT_FOUND` 含む）に対する失敗する contract test を追加する

## 2. DB スキーマとマイグレーション

- [x] 2.1 `categories`、`repository_categories`、拡張 `repository_snapshots` の Drizzle schema を追加する
- [x] 2.2 PK/UNIQUE/FK 制約とデフォルト値（`display_order`, `is_system`）を含む migration を追加する
- [x] 2.3 1日1snapshot制約と関連整合性を検証する migration テストを追加する

## 3. Seeder と登録共存

- [ ] 3.1 `llm`、`backend`、`frontend` の冪等 category seeder を実装する
- [ ] 3.2 既定リポジトリと repository-category 関連の冪等 seeder を実装する
- [ ] 3.3 既存 seed 済み URL の手動登録で重複レコードを作らないよう登録ユースケースを更新する
- [ ] 3.4 seed 済み + 手動登録の共存が回帰しないことを検証するテストを追加する

## 4. ドメインロジック（Dev Health）

- [ ] 4.1 `calculateHealthScore(input, scoreVersion)` を scoreVersion `1` で実装する
- [ ] 4.2 health score から status（`Active`/`Stale`/`Risky`）を算出するマッパーを実装する
- [ ] 4.3 explainability 用 deduction reasons 生成を実装する
- [ ] 4.4 `issueGrowth30d` と `commitLast30d` の 30日補助ロジック（欠損時 null）を実装する
- [ ] 4.5 deduction reasons を API 公開するか内部利用に限定するかを決定し、design/spec と整合させる

## 5. アプリケーション層と境界（Architecture 準拠）

- [ ] 5.1 category summary/detail の use-case を `application/use-cases` に実装する
- [ ] 5.2 category 参照・snapshot 参照・signal 更新の port を `application/ports` に定義する
- [ ] 5.3 bootstrap 配線を更新し、route から実装詳細への直接依存を排除する
- [ ] 5.4 `ApplicationError` への正規化と HTTP `error-mapper` の集約を実装する
- [ ] 5.5 category detail で healthScore 降順ソートと metrics 構造（`devHealth` + 他 null）を組み立てる

## 6. API ルートと OpenAPI 契約

- [ ] 6.1 category summary/detail/error の OpenAPI schema を追加する
- [ ] 6.2 `GET /api/categories` を use-case 経由で実装する
- [ ] 6.3 `GET /api/categories/:slug` を 404 契約（`CATEGORY_NOT_FOUND`）付きで実装する
- [ ] 6.4 `lastCommit`、`issueGrowth30d`、`commitLast30d` の nullable 契約をレスポンスで保証する
- [ ] 6.5 OpenAPI schema の定義元を domain/application 型に寄せ、重複定義を排除する
- [ ] 6.6 deduction reasons の公開方針に合わせて OpenAPI schema とレスポンス実装を一致させる

## 7. Snapshot 収集と manual refresh

- [ ] 7.1 `.github/workflows/daily-snapshot.yml` を追加し、`schedule` と `workflow_dispatch` を設定する
- [ ] 7.2 定期実行と手動再実行で共通利用する snapshot 収集エントリポイントを実装する
- [ ] 7.3 ingestion adapter に retry/backoff と 429 `Retry-After` 対応を実装する
- [ ] 7.4 取得失敗時に前回成功 snapshot を保持するテストを追加する
- [ ] 7.5 manual refresh endpoint が当日 UTC snapshot を upsert するよう更新する
- [ ] 7.6 manual refresh の回帰テスト（同日 upsert・失敗時不更新）を追加する

## 8. フロントエンド（カテゴリダッシュボード）

- [ ] 8.1 TanStack Query を用いてカテゴリタブ状態とデータ取得を実装する
- [ ] 8.2 タブ切替時に `GET /api/categories/:slug` を再取得し、loading/error を表示する
- [ ] 8.3 テーブル列を health score、status、last commit、issue delta 30d、commits 30d に更新する
- [ ] 8.4 healthScore 降順表示と nullable 表示（`null` の見せ方）を UI へ反映する
- [ ] 8.5 タブ切替・loading/error・並び順の UI テストを追加する

## 9. ロールアウト・検証・リファクタ

- [ ] 9.1 seed -> category API -> UI 表示の E2E/integration テストを追加する
- [ ] 9.2 30日前基準欠損時に `issueGrowth30d = null` を返す統合テストを追加する
- [ ] 9.3 category API を停止可能にする feature flag を実装する
- [ ] 9.4 feature flag によるロールバック手順（停止/復帰）をドキュメント化し検証する
- [ ] 9.5 `format`、`lint`、`test` を実行して回帰を解消する
- [ ] 9.6 ingestion/classification/dashboard の重複ロジックを契約不変でリファクタする
