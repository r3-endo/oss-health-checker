## Context

本変更は、GitHub 上の OSS リポジトリの保守状態を最小構成で可視化する MVP を対象とする。監視対象は GitHub Repository URL で登録し、認証なしで最大3リポジトリを扱う。バックエンドは Hono、フロントエンドは React、永続化は SQLite を利用し、GitHub REST API v3 から最終 commit 日、最終 release 日、open issues 数、contributors 数を取得する。

MVP の主眼は「一貫した説明可能な判定」であり、高度なスコアリングや AI 推論は行わない。判定はしきい値ベース（6ヶ月 commit 無し、12ヶ月 release 無し、open issues 100超）で `Active` / `Stale` / `Risky` を返す。

## Goals / Non-Goals

**Goals:**
- 1ページ UI で URL 登録と状態一覧を完結させる。
- 監視対象リポジトリ（最大3件）の状態を SQLite に保持し、再表示可能にする。
- GitHub API 取得値から一貫したルールでステータスを判定し、結果と根拠を表示する。
- MVP 実装に必要な最小 API と最小 DB スキーマを定義する。

**Non-Goals:**
- 高度な重み付きスコアリング、機械学習、LLM 要約。
- 通知連携（Slack 等）やマルチユーザー機能。
- 本番運用を想定した複雑な認証・認可設計。
- 高度な分析ダッシュボード（長期予測、相関分析など）。

## Decisions

1. アーキテクチャは React + Hono の単純な分離構成にする。
- 選択理由: MVP での開発速度と保守性を優先し、UI と API を明確に分離できる。
- 代替案: Next.js フルスタック構成。
- 代替を採らない理由: 現時点で SSR や複雑なルーティング要件がなく、構成の単純さを優先する。

2. データモデルは `repositories` と `snapshots` の2テーブル最小構成にする。
- `repositories`: URL、owner、name、作成日時、更新日時。
- `snapshots`: repository_id、last_commit_at、last_release_at、open_issues_count、contributors_count、status、fetched_at。
- 選択理由: 履歴を保持しつつ最小限のクエリで現状と推移を扱える。
- 代替案: リポジトリ単一テーブルに最新値のみ保存。
- 代替を採らない理由: リスク上昇の把握（時系列比較）がしにくくなる。

3. GitHub データ取得は手動更新トリガー + 登録時取得を基本とする。
- 選択理由: MVP では安定した UX と実装容易性を優先する。
- 代替案: cron 常時更新を必須化。
- 代替を採らない理由: 運用要素が増え、初期実装コストが上がる。cron は任意拡張として扱う。

4. 判定ロジックは加点式ではなくルール優先の段階判定にする。
- 判定例:
  - 警告条件 2つ以上: `Risky`
  - 警告条件 1つ: `Stale`
  - 警告条件 0: `Active`
- 選択理由: 判定理由をユーザーに説明しやすく、実装も検証も容易。
- 代替案: 重み付きスコア（0-100）で閾値分割。
- 代替を採らない理由: 閾値調整の恣意性が高く、MVP の説明可能性要件に反する。

5. API は最小3系統に限定する。
- `POST /repositories`: URL 登録（件数上限チェック、初回取得まで実行）。
- `GET /repositories`: 一覧と最新 snapshot を返す。
- `POST /repositories/:id/refresh`: 対象リポジトリの再取得・再判定。
- 選択理由: UI 要件を満たす最小セットであり、過剰な設計を避けられる。

## Risks / Trade-offs

- [GitHub API rate limit 超過] → Mitigation: 監視対象を最大3件に制限し、取得頻度を手動中心にする。
- [release が存在しない repo の扱いが曖昧] → Mitigation: `last_release_at = null` を許容し、判定ロジックで明示的に扱う。
- [contributors 数取得の API コストが高い] → Mitigation: 上位 contributor 数のみを取得し、必要に応じてページングを打ち切る。
- [ステータス判定が単純すぎる] → Mitigation: 判定根拠（どの条件に該当したか）を UI で表示し、将来拡張可能な関数境界を維持する。
- [DB ファイル破損やローカル環境差分] → Mitigation: 初期化スクリプトと最小マイグレーション手順を README に記載する。
