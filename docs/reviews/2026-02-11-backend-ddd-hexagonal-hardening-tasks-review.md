# Review: `backend-ddd-hexagonal-hardening/tasks.md` (2026-02-11)

## 対象
- `openspec/changes/backend-ddd-hexagonal-hardening/tasks.md`
- 参照元レビュー: `docs/reviews/2026-02-11-backend-ddd-hexagonal-review.md`

## Findings（重大度順）

### 1. 参照レビューの Phase 6（DDD純度向上）が tasks に未反映（中）
- 参照レビューでは以下を「任意だが推奨」として提示しているが、tasks に該当タスクがない。
  - `snapshot-factory` の業務判定ロジックを domain service/value object へ寄せる
  - GitHub URL 正規化の value object 化検討
- 参照:
  - `docs/reviews/2026-02-11-backend-ddd-hexagonal-review.md`
  - `openspec/changes/backend-ddd-hexagonal-hardening/tasks.md:1`
- 影響:
  - 今回の change 完了時に「境界・契約の改善」は達成しても、ドメイン知識の配置最適化が先送りされる。

### 2. 一部タスクが重複し、Done判定が曖昧（中）
- OpenAPI 未接続検知と drift 検知の追加が複数セクションに分散している。
  - `1.3` と `4.5` は OpenAPI 未接続検知で重複気味
  - `1.3` と `6.3` は drift 検知で重複気味
- 参照:
  - `openspec/changes/backend-ddd-hexagonal-hardening/tasks.md:5`
  - `openspec/changes/backend-ddd-hexagonal-hardening/tasks.md:30`
  - `openspec/changes/backend-ddd-hexagonal-hardening/tasks.md:44`
- 影響:
  - 実装完了条件が曖昧になり、同じ成果物に対して複数チェックを消化する運用負荷が出る。

### 3. `2.5` の型設計受け入れ条件が不足（低）
- `ApplicationError.detail` を判別可能 union にする方針はあるが、どの error code にどの detail 型を許可するかの受け入れ条件がない。
- 参照: `openspec/changes/backend-ddd-hexagonal-hardening/tasks.md:13`
- 影響:
  - 実装者ごとに detail 形状がぶれ、将来の後方互換性に影響しうる。

## 反映提案（tasks.md への具体追記/整理）

1. **Phase 8（任意）を追加**
- `8.1` `snapshot-factory` 判定ロジックの domain service/value object 化の可否を設計判断として記録する
- `8.2` GitHub URL の value object 化を実施または defer 判断（理由付き）を記録する

2. **重複タスクの整理**
- `1.3` は「CIジョブ追加の親タスク」に寄せる
- `4.5` は「OpenAPI contract テスト実装」
- `6.3` は「drift 検知コマンド実装」
- それぞれ成果物を明示（例: テストファイル名、CIジョブ名、package script名）

3. **`2.5` に受け入れ条件を追加**
- 例:
  - `VALIDATION_ERROR`: `{ reason?: string; limit?: number }`
  - `RATE_LIMIT`: `{ status?: number; retryAfterSeconds?: number | null }`
  - `EXTERNAL_API_ERROR`: `{ status?: number }`
  - `INTERNAL_ERROR`: `{ cause?: string }`
  - `NOT_FOUND`: `undefined`

## 総評
- 現在の `tasks.md` は、参照レビューの主要指摘（エラー契約統一、UoW、OpenAPI接続、型安全、schema/migration統制）をほぼ網羅しており、方向性は妥当。
- 上記 3 点を補強すれば、「レビュー反映済み」としてより明確な完了基準になる。
