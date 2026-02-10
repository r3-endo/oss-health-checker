# Backend Diff Robustness & Security Review (2026-02-10)

対象: 現在のワークツリー差分（GitHub Signal Ingestion まわりの追加実装）
観点: 堅牢性、クリーンコード、エラーハンドリング、OWASP Top 10

## Findings

### 1. High - 例外の握りつぶしで障害原因が失われる
- 参照: `backend/src/application/use-cases/refresh-repository-use-case.ts:49`
- `catch` が広く、GitHubエラー以外（DB障害、実装バグ、データ不整合）も `INTERNAL_ERROR` に変換してしまう。
- 原因情報が失われ、障害解析・監視が困難になる（`A09: Security Logging and Monitoring Failures` 観点で弱い）。

### 2. Medium - 外部呼び出し失敗時の原因情報が欠落
- 参照: `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:274`
- 未知例外を `new GitHubApiError(502, "Failed to call GitHub API")` に置換し、元例外を保持していない。
- エラー分類はできているが、根本原因を捨てており運用上の調査性が低下する（`A09`）。

### 3. Medium - `GITHUB_API_BASE_URL` の検証がなく SSRF 面で設定依存
- 参照: `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:294`
- URLをそのまま組み立てて `fetch` しているため、設定ミス/改ざん時に内部ネットワークへ到達しうる。
- ユーザー入力起点ではないため即高リスクではないが、`https` 強制・許可ホスト制限などの防御が望ましい（`A10: SSRF` / `A05: Security Misconfiguration`）。

### 4. Medium - 登録フローが非原子的で部分成功状態を残す
- 参照: `backend/src/application/use-cases/register-repository-use-case.ts:29`
- `repository` 作成後に GitHub取得や snapshot保存が失敗すると、snapshotなし repository が残る。
- レース条件というより整合性問題。再実行時の重複/復旧戦略が不明確で、堅牢性を損なう。

### 5. Low - レイヤ分離のにじみ（クリーンコード観点）
- 参照: `backend/src/application/use-cases/refresh-repository-use-case.ts:8`
- アプリケーション層がインフラ層の具体エラー型に依存。
- 実装差し替え時の結合が強く、保守性低下につながる。

## OWASP Top 10 観点（今回差分）

- A03 Injection: 目立つ注入経路は未検出（`encodeURIComponent` 使用、SQL文字列連結なし）。
- A09 Logging/Monitoring: Findings 1, 2 により弱い。
- A10 SSRF: Finding 3 の設定依存リスクあり。
- A01/A02/A04/A06/A07/A08: この差分単体では評価材料不足。

## Verification

- `bun run typecheck`: 成功
- `bun run test`: 成功（`11 passed`, `3 skipped`）

## Open Questions

1. `RefreshRepositoryService` の `INTERNAL_ERROR` は、詳細非公開を意図した設計か（ログ出力は別層で実施済みか）。
2. `GITHUB_API_BASE_URL` は運用で固定か（固定でない場合はホワイトリスト化を推奨）。
