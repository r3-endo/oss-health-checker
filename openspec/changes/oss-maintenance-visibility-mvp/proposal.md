## Why

OSS リポジトリの保守劣化は徐々に進むため、問題が表面化する前に気づきにくい。GitHub の公開データを使って「保守されているか」「リスクが上がっているか」を一貫したルールで可視化する MVP が必要である。

## What Changes

- GitHub Repository URL を入力して監視対象を登録できる（認証なし、1ユーザー最大3リポジトリ）。
- GitHub REST API v3 から以下を取得して保存する: 最終 commit 日、最終 release 日（なければ null）、open issues 数、contributors 数。
- 単純なルールベース判定を実装する: 6ヶ月以上 commit なし、12ヶ月以上 release なし、open issues 100件超を警告条件とする。
- 判定結果を `Active` / `Stale` / `Risky` の3段階で表示する（正確性より一貫性と説明可能性を優先）。
- 1ページ構成の UI を提供する（上部: URL入力フォーム、下部: リポジトリ一覧テーブル）。
- MVP外として、高度なスコアリング、AI要約、Slack連携、マルチユーザー管理は含めない。

## Capabilities

### New Capabilities
- `repository-registration`: GitHub Repository URL の登録と監視対象管理（最大3件）を提供する。
- `repository-signal-ingestion`: GitHub REST API v3 から commit/release/issues/contributors の最小シグナルを取得・保存する。
- `maintenance-status-classification`: 明示ルールに基づき `Active` / `Stale` / `Risky` を判定する。
- `maintenance-health-dashboard`: 入力フォームとリポジトリ状態テーブルを1ページで表示する。

### Modified Capabilities
- なし（既存 spec の要求変更なし）

## Impact

- Affected code: React フロントエンド、Hono API、GitHub 取得処理、判定ロジック、SQLite 永続化。
- APIs: GitHub REST API v3 の利用、監視対象登録/一覧/判定結果取得 API の新規追加。
- Dependencies: React、Hono、SQLite クライアント、GitHub API クライアント。
- Systems: Web アプリ本体と最小 DB スキーマ（必要に応じて日次更新ジョブを追加可能）。
