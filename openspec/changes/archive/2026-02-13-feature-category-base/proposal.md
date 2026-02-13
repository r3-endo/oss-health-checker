## Why

現在の OSS ヘルス監視はリポジトリ単位で手動登録が前提となっており、技術ドメイン横断での比較監視が難しい状態です。Phase 1 を単なる UI 改修ではなく **Dev Health Radar 基盤整備フェーズ** として定義し、運用負荷を抑えながら LLM/Backend/Frontend の健全性を素早く把握でき、将来の指標レイヤ拡張（Adoption/Security/Governance）に再設計なしで進められる土台を先に作る必要があります。

## What Changes

- 事前定義された OSS グループ（`llm`, `backend`, `frontend`）向けに、カテゴリドメインデータとリポジトリ-カテゴリ関連を導入する。
- 既存の手動リポジトリ登録の挙動を維持したまま、デフォルトカテゴリとキュレーション済みリポジトリの冪等シードを追加する。
- 日次スナップショット永続化を導入し、Phase 1 で使う指標に加えて将来の Dev Health 拡張で利用するカラムを nullable 前提で先行確保する（頻繁なマイグレーションを回避）。
- Health score は動的計算を維持しつつ、`scoreVersion` を導入して評価ロジックの進化に追従可能にする（スコア値自体は DB 保存しない）。
- Bus Factor proxy として `distinct_committers_90d` と `top_contributor_ratio_90d` を扱える設計にする。
- カテゴリ API（`GET /api/categories`, `GET /api/categories/:slug`）を追加し、health score、status、30 日トレンド、将来拡張可能な metrics 構造を返せる契約を定義する。
- ダッシュボード UI をカテゴリタブ方式に更新し、Dev Health 指標（Health Score, Status, Last Commit, Issue Δ 30d, Commits 30d）をローディング/エラー状態付きで表示する。

## Capabilities

### New Capabilities
- `repository-category-grouping`: カテゴリとリポジトリ-カテゴリ関連を管理し、カテゴリ一覧およびカテゴリ詳細取得の契約を提供する。

### Modified Capabilities
- `maintenance-health-dashboard`: ダッシュボードの操作モデルをフラットなリポジトリ一覧からカテゴリタブ遷移へ変更し、Dev Health 向けヘルス/トレンド列を拡張する。
- `maintenance-status-classification`: 数値 health score 計算ルールに `scoreVersion` を導入し、算出スコアに基づく status マッピングの意味論を維持する。
- `repository-signal-ingestion`: カテゴリ API が利用する日次スナップショット、30 日比較データ、Bus Factor proxy 指標を追加する。
- `repository-registration`: 既定シード済みリポジトリとの共存条件を明確化し、既存の登録フローに退行がないことを保証する。

## Impact

- Backend: `categories`, `repository_categories`, `repository_snapshots` の schema/migration 更新。`categories` は将来運用向け拡張フィールド（例: `display_order`, `is_system`）を持てる設計とし、`repository_snapshots` は将来利用予定の signal カラムと `health_score_version` を保持可能にする。
- Application/Domain: route handler に業務ロジックを置かず、scoring は抽象 DTO に依存させる。GitHub adapter は raw signal 返却に限定し、将来の Adoption/Security/Governance レイヤ追加を可能にする。
- Infrastructure: GitHub シグナル収集経路を日次スナップショットのスケジュール実行（最小構成 cron）に対応するよう拡張。
- Frontend: カテゴリタブ状態管理、カテゴリデータ取得フロー、テーブル列更新。
- Contracts: カテゴリ API のレスポンス形状に派生トレンド項目（`issueGrowth30d`, `commitLast30d`）と将来拡張用 metrics コンテナ（`devHealth`/`adoption`/`security`/`governance`）を定義可能にする。

## Non-Goals

- npm / Maven / PyPI 由来データの取り込み
- Security advisory の評価
- Governance 指標評価
- 依存関係解析
- 認証・課金・Slack 連携
- 機械学習ベースのスコアリング
