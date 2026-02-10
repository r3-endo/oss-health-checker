# Backend Code Quality Follow-up Review (2026-02-10)

対象: 追加実装の責務分離・共通化・ハッキング的実装の有無
観点: クリーンコード、堅牢性、エラーハンドリング、OWASP観点の情報露出

## Findings

### 1. High - 内部エラー詳細をHTTPレスポンスに露出
- 参照: `backend/src/interface/http/error-mapper.ts:22`, `backend/src/application/use-cases/list-repositories-with-latest-snapshot-use-case.ts:22`
- `ApplicationError.detail.cause`（内部例外メッセージ）をそのまま返却している。
- 本番運用では情報漏えいリスクとなるため、内部詳細はログ側に限定し、レスポンスは一般化した文言に制限すべき。

### 2. Medium - `GitHubRestRepositoryGateway` の責務過密
- 参照: `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:162`
- 設定検証、HTTP実行、再試行、レート制限判定、レスポンス解析、ドメイン変換が1クラスに集中。
- 変更耐性・可読性・テスタビリティが低下しやすい。

### 3. Medium - エラー変換時に有用な詳細が欠落
- 参照: `backend/src/application/use-cases/refresh-repository-use-case.ts:49`
- `RepositoryGatewayError.detail`（`status`, `retryAfterSeconds` など）を `RefreshError` 側へ伝搬していない。
- 呼び出し側で再試行判断や監視情報として利用できず、運用上の観測性が下がる。

### 4. Low - APIパス構築ロジックの重複
- 参照: `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:180`, `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:184`, `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:188`, `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:193`
- `/repos/${owner}/${name}` 組み立てが散在している。
- 共通ヘルパー化で変更漏れリスクを下げられる。

### 5. Low - 例外体系の不統一
- 参照: `backend/src/infrastructure/gateways/github-rest-repository-gateway.ts:141`
- `validateApiBaseUrl` は plain `Error` を投げる一方、他は `RepositoryGatewayError` を使用。
- ハンドリング方針が分散し、呼び出し側の実装一貫性を損ねる。

## Overall

- ハッキング的な場当たり実装は少なく、全体として整理はされている。
- ただし `High` の情報露出と `Medium` の責務過密は、早めの是正が望ましい。
