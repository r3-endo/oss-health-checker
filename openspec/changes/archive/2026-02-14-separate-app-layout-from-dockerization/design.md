## Context

現状のリポジトリは `backend` 中心の構成であり、`frontend`・`batch`・`db`・`infra` を独立した実行/運用単位として扱う前提が弱い。今後のセルフホスト運用（単一ホスト `docker compose`）では、アプリ実行単位と運用資産を明確に分離したレイアウトが必要である。

制約は以下。
- 本変更では API の外部契約を変えない。
- Dockerfile / compose 実装は次の change に分離する。
- 既存の Bun/TypeScript/Drizzle を継続利用する。
- 既存の `git`/`npm` 取得処理は将来的に batch 境界へ寄せるが、本変更ではまず配置と依存境界を確立する。

主な関係者は、backend 実装者、batch 運用担当、将来の frontend 実装者、CI 管理者。

## Goals / Non-Goals

**Goals:**
- 実行可能アプリを `apps/frontend` `apps/backend` `apps/batch` に分離する。
- 共通ロジックを `packages/*` に寄せ、アプリ間で import 可能な境界を定義する。
- DB 資産を `db/`（migrations / drizzle / seeds）に集約し、アプリコードから責務分離する。
- 運用資産を `infra/` に集約し、次 change の Docker 化に備える。
- ルート基点で Bun workspace と TypeScript path alias を整備し、深い相対 import を減らす。
- ローカル実行手順を README/architecture に明文化し、移行中も開発者が迷わない状態を維持する。

**Non-Goals:**
- Dockerfile / `compose.yml` の作成。
- Postgres への移行実装。
- API の振る舞い変更（HTTP ステータス、レスポンス仕様、エンドポイント追加/削除）。
- batch 実行スケジューラ（cron/systemd/K8s CronJob）導入。

## Decisions

### 1. ディレクトリ構造は「apps / packages / db / infra」に固定する
- 採用構造:
  - `apps/frontend`
  - `apps/backend`
  - `apps/batch`
  - `packages/common`（本 change では単一パッケージで開始）
  - `db`（migrations / drizzle / seeds）
  - `infra`（compose / env / scripts）
- 理由:
  - 実行単位（apps）と資産単位（db/infra）を明確に分離できる。
  - 単一ホスト構成でも、将来のサービス分割に耐える。
- 代替案:
  - `apps` 配下に `db` `infra` を置く案は、実行可能アプリと運用資産が混在するため不採用。

### 2. package.json はルート集約を基本とし、必要時のみ app 個別化する
- 初期方針:
  - ルート `package.json` を workspace 入口として維持。
  - app 側は最小限の `package.json`（またはルート scripts 経由）で開始。
- 理由:
  - 依存管理の分散を抑え、移行初期のコストを下げる。
- 代替案:
  - 各 app 完全独立 package 管理は境界が明確だが、現時点では運用負荷が高いため段階導入とする。

### 3. import は workspace エイリアス優先に統一する
- 方針:
  - `@common/*` の alias を導入し、`../../..` 連鎖を削減する。
  - app 間直接依存を避け、必ず `packages/*` を経由する。
- 理由:
  - リファクタ時のパス破壊を減らし、責務境界を機械的に検証しやすくする。
- 代替案:
  - 相対パス運用継続は短期変更量は少ないが、中長期で保守性が悪化するため不採用。

### 4. DB 境界は「db 資産」と「実行時アダプタ」を分離する
- 方針:
  - `db/` はマイグレーション等の資産置き場。
  - 実行時の DB アクセスコードは `packages` 側の adapter に置く。
- 理由:
  - `db` をアプリとして扱わず、責務を明確化できる。
  - 将来 SQLite から Postgres に変更しても、差し替え点を限定できる。
- 代替案:
  - backend 配下に DB 資産を残す案は、batch/frontend との共有時に責務が不明瞭になるため不採用。

### 5. `apps/frontend` は本 change で「プレースホルダのみ」を作成する
- 方針:
  - フロント本体の移設は別 change に任せ、この change では `apps/frontend/README.md` など最小構成のみ作成する。
- 理由:
  - レイアウト変更の責務を限定し、バックエンド移行と混在させない。

### 6. migrate 実行責務は「専用コマンド」に寄せる
- 方針:
  - migrate は API 起動時に暗黙実行せず、明示コマンド（例: `bun run db:migrate`）で実行する。
- 理由:
  - 複数サービス構成での起動順競合や重複実行リスクを抑える。

### 7. 移行は「テスト先行 + 段階移行」とする
- 方針:
  1. 失敗する境界テストを先に追加（Red）
  2. ディレクトリ/import 移行を最小単位で適用
  3. テストを Green 化
  4. docs/CI を更新
  5. 次 change で Docker 化
- 理由:
  - レイアウト変更とランタイム変更を分離し、障害切り分けを容易にする。

### 8. 実装は小さな PR に固定分割する
- 方針:
  - 1 change を 4 PR で進める。
  - PR-1: ガードテスト + workspace 基盤
  - PR-2: apps 分離 + packages 参照置換
  - PR-3: db/infra 分離 + スクリプト/CI 修正
  - PR-4: README/architecture 更新 + 最終検証
- 理由:
  - 1PRあたりの責務を狭く保ち、レビュー容易性とロールバック容易性を確保する。

## Risks / Trade-offs

- [Risk] import 変更漏れでビルド失敗が発生する
  → Mitigation: エイリアス導入後に `typecheck` と全テストを必須化し、段階的に移動する。

- [Risk] 既存スクリプトや CI のパス参照が壊れる
  → Mitigation: ルート script を先に整備し、CI はルートコマンドのみ参照する。

- [Risk] 「apps と packages の境界」が時間経過で崩れる
  → Mitigation: import ルールを lint/contract test で固定し、app 間直接依存を禁止する。

- [Risk] `db/` が遠くなり開発体験が悪化する
  → Mitigation: ルート scripts で migrate/seed を短縮コマンド化し、場所の遠さを運用で吸収する。

- [Risk] 別エージェント実装時に解釈差が出る
  → Mitigation: `tasks.md` に実施順・完了条件・PR作成ポイント・確認コマンドを明記する。

## Migration Plan

1. PR-1: レイアウト境界テスト（失敗）を追加し、workspace/tsconfig を整備する。
2. PR-2: `apps/backend` `apps/batch` と `packages/common` への移行を行う。
3. PR-3: `db/` `infra/` への資産分離と scripts/CI 修正を行う。
4. PR-4: `README` `docs/architecture.md` を更新し、最終 Green を確認する。

ロールバック方針:
- 問題発生時は該当PRのみを revert して段階的に戻す。
- 仕様変更を含まないため、データ移行ロールバックは不要。

## Open Questions

- `frontend` の本体移設を行う次 change の命名と開始タイミング。
- Docker 化 change で `migrate` をどのサービス起点で実行するか（専用 one-shot job か batch 起点か）。
