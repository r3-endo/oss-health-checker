# feature-category-base tasks.md レビュー

対象:
- `openspec/changes/feature-category-base/tasks.md`
- `openspec/changes/feature-category-base/proposal.md`
- `openspec/changes/feature-category-base/design.md`
- `docs/architecture.md`

観点:
- proposal/design の反映漏れ
- アーキテクチャ整合性
- OpenAPI ルール反映

## Findings（重大度順）

1. **High**: deduction reasons の要件と API 契約が不整合
- `tasks.md` では deduction-reason payload 実装を要求している（`openspec/changes/feature-category-base/tasks.md:25`）。
- ただし design の `CategoryDetail/RepositoryView` 契約には reason フィールドが定義されていない（`openspec/changes/feature-category-base/design.md:89`）。
- classification spec は reason をレスポンスに含める要件を持つ（`openspec/changes/feature-category-base/specs/maintenance-status-classification/spec.md:37`）。
- 対応: reason を API 公開するか内部利用に限定するかを決め、OpenAPI schema と tasks の両方を一致させる必要がある。

2. **Medium**: repository-signal-ingestion の manual refresh 要件が tasks に不足
- spec には manual refresh で当日 snapshot を upsert する要件がある（`openspec/changes/feature-category-base/specs/repository-signal-ingestion/spec.md:17`）。
- tasks には schedule/workflow_dispatch/retry はあるが、refresh endpoint 側の反映タスクが無い（`openspec/changes/feature-category-base/tasks.md:44`）。
- 対応: refresh use-case/route の更新と回帰テストを 7.x or 9.x に追加。

3. **Medium**: アーキテクチャ遵守の作業粒度が不足
- architecture は `application/use-cases` と `application/ports` 先行、`ApplicationError` 正規化、HTTP error mapping 集約を要求（`docs/architecture.md:57`, `docs/architecture.md:60`）。
- tasks は機能要件中心で、port定義・bootstrap配線・error-mapper統一が明示されていない（`openspec/changes/feature-category-base/tasks.md:30`）。
- 対応: 境界維持タスクを追加し、実装の逸脱を防ぐ。

4. **Low**: design のロールバック方針が tasks に落ちていない
- design は feature flag によるカテゴリ API 停止可能性まで定義（`openspec/changes/feature-category-base/design.md:244`）。
- tasks 側に実装/検証タスクがない（`openspec/changes/feature-category-base/tasks.md:56`）。
- 対応: 必要なら 9.x に追加。不要なら design から削除して整合を取る。

## OpenAPI ルール反映チェック

結論: **部分的に反映済みだが、運用上の抜けがある。**

反映されている点:
- design 制約で API 契約を OpenAPI（`@hono/zod-openapi`）で固定すると明示（`openspec/changes/feature-category-base/design.md:12`）。
- tasks に OpenAPI schema 追加タスクがある（`openspec/changes/feature-category-base/tasks.md:37`）。
- tasks に contract tests の追加がある（`openspec/changes/feature-category-base/tasks.md:3`）。

不足している点:
- 「OpenAPI schema を単一ソースにして domain/application の定義を再利用する」という architecture 原則の具体タスクがない（`docs/architecture.md:7`）。
- deduction reasons など、spec と OpenAPI 契約の差分検知・解消タスクが無い。

推奨追加タスク:
1. OpenAPI schema 生成元（domain/application 型）を明示し、重複定義禁止ルールを tasks に追加。
2. spec -> OpenAPI -> 実レスポンスの整合を検証する契約テストを追加。
3. `CATEGORY_NOT_FOUND` など error code の OpenAPI 定義と `error-mapper` 実装一致を検証するテストを追加。

## 総評

`tasks.md` は主要スコープを概ねカバーしているが、
- spec と API 契約の不整合（deduction reasons）
- ingestion の manual refresh 反映漏れ
- アーキテクチャ境界の実装タスク不足

が残っている。OpenAPI ルール自体は記載されているが、単一ソース化と整合検証の運用タスクまで落とし込むと、実装時のズレを防げる。
