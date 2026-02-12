# feature-category-base design.md レビュー

対象: `openspec/changes/feature-category-base/design.md`
観点: シニアエンジニア視点での実装可能性（実装に落とし込める粒度か）

## Findings（重大度順）

1. **High**: API契約が実装可能レベルまで具体化されていない
- `GET /api/categories` / `GET /api/categories/:slug` のレスポンス形状（必須/nullable/型/例）が未定義。
- `metrics` を外部公開するかも未決で、FE/BE 並行実装時に解釈ズレが発生する。
- 参照: `openspec/changes/feature-category-base/design.md:100`, `openspec/changes/feature-category-base/design.md:114`

2. **High**: スコア算出仕様が不足している
- `calculateHealthScore` の入力定義、重み、正規化方法、`Active/Stale/Risky` の閾値が未定義。
- `scoreVersion` の互換ポリシーが曖昧で、将来変更時の比較可能性が担保されない。
- 参照: `openspec/changes/feature-category-base/design.md:44`, `openspec/changes/feature-category-base/design.md:73`

3. **High**: 30日差分の計算規約が曖昧
- 基準時刻（UTC/JST）、欠損日の扱い、`issueGrowth30d` の算式（差分/増加率）、`commitLast30d` と snapshot列の関係が未定義。
- 実装者ごとに異なるロジックになり、検証不能な差異を生む可能性がある。
- 参照: `openspec/changes/feature-category-base/design.md:17`, `openspec/changes/feature-category-base/design.md:76`, `openspec/changes/feature-category-base/design.md:94`

4. **Medium**: DB設計の制約定義が不足
- `categories.slug` の一意制約、`repository_categories` の複合一意、`repository_snapshots` の repo+date 一意、upsertキーが明記されていない。
- 冪等性要件（seed/日次ジョブ）をDBレイヤで保証しづらい。
- 参照: `openspec/changes/feature-category-base/design.md:32`, `openspec/changes/feature-category-base/design.md:76`, `openspec/changes/feature-category-base/design.md:98`

5. **Medium**: ジョブ実行基盤が未確定で運用設計が止まる
- Hono scheduled handler と GitHub Actions cron の選定が未確定。
- リトライ、失敗通知、手動再実行、APIレート制限時挙動が決められない。
- 参照: `openspec/changes/feature-category-base/design.md:62`, `openspec/changes/feature-category-base/design.md:112`

6. **Medium**: TDD観点の受け入れ条件が粗い
- テスト観点は列挙されているが、失敗系（GitHub API失敗、部分欠損、429/5xx、null境界）ごとの期待レスポンス・期待永続化結果が未定義。
- Red→Green の具体的テストケースに分解しにくい。
- 参照: `openspec/changes/feature-category-base/design.md:107`

## Open Questions / Assumptions

1. `metrics` を Phase 1 で公開する場合、OpenAPI スキーマを先に固定する必要がある（後方互換性の起点になるため）。
2. `commit_count_30d` を snapshot に保存するなら、「snapshot日時点の30日ローリング値」として定義を明文化する前提で進めるべき。
3. `scoreVersion` は `v1` を明示し、将来 `v2` 併存期間を設ける運用（レスポンスに version 同梱）を事前定義するべき。

## 結論

現状の design は方向性として妥当だが、実装に落とし込むには未確定事項が残る。
以下を `design.md` に追記すれば実装着手可能な粒度に近づく。

1. API 入出力スキーマ（nullable 含む）
2. スコア算式と閾値
3. 30日計算規約（時刻・欠損・算式）
4. DB 一意制約と upsert キー
5. ジョブ運用仕様（失敗時挙動・再実行）
