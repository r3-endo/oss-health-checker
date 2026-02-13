## Context

本変更は、既存のリポジトリ単位監視を「カテゴリ単位で比較可能な Dev Health 基盤」へ拡張する設計である。現状は手動登録と単発表示が中心で、技術ドメイン別の継続観測や 30 日トレンド比較が難しい。  
Phase 1 では Dev Health 指標に限定しつつ、後続フェーズで Adoption / Security / Governance を追加できるよう、データモデルと API 契約を先に拡張可能な形へ揃える。

制約:
- TypeScript strict mode
- ルートハンドラに業務ロジックを置かない
- GitHub API アクセスは infrastructure adapter に閉じる
- スコア値は DB に保存せず動的計算を維持する
- 既存 `repositories` と手動登録フローは破壊しない
- API 契約は OpenAPI（`@hono/zod-openapi`）で固定する

## Goals / Non-Goals

**Goals:**
- カテゴリ（`llm`/`backend`/`frontend`）とリポジトリ関連を導入し、カテゴリ単位の一覧・詳細 API を提供する。
- 日次スナップショットを導入し、`issueGrowth30d` と `commitLast30d` を計算可能にする。
- 数値 health score（0-100）と status（`Active`/`Stale`/`Risky`）を動的に算出する。
- `scoreVersion` と将来指標用カラムを導入し、仕様進化時の再設計コストを下げる。
- Frontend をカテゴリタブ + トレンド表示に移行し、読み込み/失敗状態を明示する。

**Non-Goals:**
- npm / Maven / PyPI データ取り込み
- Security advisory / Governance 指標評価
- 依存関係解析
- 認証・課金・Slack 連携
- 機械学習によるスコア算出

## Decisions

1. カテゴリ基盤を独立 capability として追加する
- Decision: `categories` と `repository_categories` を新設し、カテゴリ情報を repository 本体から分離する。
- Rationale: 複数カテゴリ所属や表示順制御などの将来要件を自然に扱える。
- Alternative considered: `repositories` に category 列を直接追加する。
- Why not: 1:N や運用属性（表示順・システム管理区分）を扱いづらく、拡張時に再設計が必要。

2. `repository_snapshots` は Phase 1 必須 + 将来拡張用カラムを先行確保する
- Decision: Phase 1 で必要な `open_issues`, `commit_count_30d` に加え、将来利用予定の signal（例: `commit_count_total`, `contributor_count`, `last_release_at`, `release_count`, `star_count`, `fork_count`, `distinct_committers_90d`, `top_contributor_ratio_90d`, `health_score_version`）を nullable 前提で保持可能にする。
- Rationale: フェーズ追加ごとの破壊的 migration を避ける。
- Alternative considered: 必要最小カラムのみで開始し、都度 migration する。
- Why not: データ互換性・API 契約・集計実装の変更点が散在し、開発速度を落とす。

3. スコアは「動的計算 + バージョン管理」を採用する
- Decision: score 値は保存せず、`calculateHealthScore(input, scoreVersion)` で算出する。Phase 1 は `scoreVersion = 1` を固定し、レスポンスに version を同梱する。snapshot には `health_score_version` を保持可能にする。
- Rationale: 現行方針（動的計算）を維持しながら、将来ルール変更時の比較可能性と説明可能性を確保できる。
- Alternative considered: score そのものを snapshot に保存する。
- Why not: ルール変更時に再計算負債と整合性問題を生みやすい。

4. API は metrics コンテナを Phase 1 から公開する
- Decision: カテゴリ詳細レスポンスに `metrics` を含め、Phase 1 では `metrics.devHealth` を必須、`adoption`/`security`/`governance` は `null` で返す。
- Rationale: クライアント互換性を保ったまま段階的に指標レイヤを追加できる。
- Alternative considered: Phase 1 は平坦レスポンスのみ。
- Why not: Phase 2 以降で API 破壊的変更が起きやすい。

5. deduction reasons は Phase 1 では API 非公開（内部利用限定）とする
- Decision: deduction reasons は score 算出時に内部生成するが、Phase 1 の API レスポンスには含めない。
- Rationale: 契約を最小化しつつ、将来の説明可能性要件や監査ログ用途へ拡張余地を残せる。
- Alternative considered: Phase 1 から API に reasons を公開する。
- Why not: 表示仕様・文言仕様が未確定のまま公開すると、互換維持コストが先行して増える。

6. レイヤ責務を固定し、GitHub adapter は raw signal のみ返す
- Decision: infrastructure は取得、application はユースケース調停、domain は評価/集計ロジックを担当する。route は I/O 変換のみに限定する。
- Rationale: Clean Architecture 境界を守り、外部依存変更（GitHub API 仕様差異、収集元追加）への耐性を持たせる。
- Alternative considered: route/service 層で計算を直接実装する。
- Why not: 変更点が散らばり、テストと保守が困難になる。

7. 日次ジョブ基盤は GitHub Actions cron に固定する
- Decision: Phase 1 は GitHub Actions `schedule` + `workflow_dispatch` を採用し、日次 snapshot 更新を実行する。
- Rationale: 既存 CI と同じ運用面に寄せ、アプリ常駐要件なしで最小コスト運用できる。
- Alternative considered: Hono scheduled handler。
- Why not: 実行基盤依存が増え、ローカル/本番で挙動差が出やすい。

## API Contract (Phase 1 固定)

### GET /api/categories

- 200 Response: `CategorySummary[]`
- `CategorySummary`
  - `slug: "llm" | "backend" | "frontend"`
  - `name: string`
  - `displayOrder: number`

### GET /api/categories/:slug

- Path param: `slug`（`llm|backend|frontend`、未知値は 404）
- 200 Response: `CategoryDetail`
- 404 Response: `{"code":"CATEGORY_NOT_FOUND","message":string}`

`CategoryDetail`:
- `slug: string`
- `name: string`
- `repositories: RepositoryView[]`（`healthScore` 降順）

`RepositoryView`:
- `owner: string`
- `name: string`
- `lastCommit: string | null` (ISO 8601 UTC)
- `metrics: {
    devHealth: {
      healthScore: number,
      status: "Active" | "Stale" | "Risky",
      scoreVersion: number,
      issueGrowth30d: number | null,
      commitLast30d: number | null
    },
    adoption: null,
    security: null,
    governance: null
  }`

## Score Specification (scoreVersion=1)

入力 DTO（null 許容）:
- `lastCommitAt: Date | null`
- `lastReleaseAt: Date | null`
- `openIssues: number | null`
- `contributors: number | null`
- `evaluatedAt: Date`（UTC）

算式:
1. 初期値 `score = 100`
2. `lastCommitAt == null` または `evaluatedAt - lastCommitAt > 180 days` なら `score -= 40`
3. `lastReleaseAt == null` または `evaluatedAt - lastReleaseAt > 365 days` なら `score -= 20`
4. `openIssues != null && openIssues > 100` なら `score -= 15`
5. `contributors != null && contributors < 3` なら `score -= 15`
6. `score = clamp(score, 0, 100)`

status mapping:
- `Active`: `score >= 70`
- `Stale`: `40 <= score <= 69`
- `Risky`: `score < 40`

互換ポリシー:
- Phase 1 は `scoreVersion=1` のみを返す。
- 将来 `v2` 導入時も `v1` を最低 1 リリース併存し、レスポンスに必ず `scoreVersion` を同梱する。

## 30日計算規約

- すべて UTC 基準。
- snapshot の `recorded_at` は `YYYY-MM-DDT00:00:00Z`（日単位正規化）で保存。
- 1 repo あたり 1 日 1 snapshot（同日再実行は upsert）。
- `commit_count_30d` は「snapshot 記録時点から過去30日ローリング件数」。
- `issueGrowth30d = current_open_issues - open_issues_at_or_before(recorded_at - 30 days)`
  - 30 日前以前で最も近い snapshot が無い場合は `null`。
- `commitLast30d = current_snapshot.commit_count_30d`（null の場合は null を返す）。

## DB Constraints / Upsert Keys

`categories`:
- PK: `id`
- UNIQUE: `slug`
- 推奨列: `display_order INTEGER NOT NULL DEFAULT 0`, `is_system BOOLEAN NOT NULL DEFAULT 1`

`repository_categories`:
- PK: `(repository_id, category_id)`
- FK: `repository_id -> repositories.id`, `category_id -> categories.id`

`repository_snapshots`:
- PK: `(repository_id, recorded_at)`
- FK: `repository_id -> repositories.id`
- upsert key: `(repository_id, recorded_at)`

冪等性:
- Seeder: `categories.slug` と `repositories(owner,name)` の一意性を使って upsert。
- 日次ジョブ: `repository_snapshots` の PK で upsert。

## Job Operations (GitHub Actions)

- 実行方式: `.github/workflows/daily-snapshot.yml`
- Trigger:
  - `schedule: cron("0 1 * * *")`（毎日 01:00 UTC）
  - `workflow_dispatch`（手動再実行）
- 失敗時挙動:
  - 対象 repo の snapshot は更新しない（前回成功データ維持）
  - ログに repo 単位失敗理由（429/5xx/timeout）を出力
  - job 全体は部分失敗を許容し、最終的に失敗件数をサマリ出力
- リトライ:
  - GitHub API 呼び出しは指数バックオフで最大 3 回
- レート制限:
  - 429 受信時は `Retry-After` を尊重し、上限超過で当該 repo を skip

## Test Strategy (TDD)

Red→Green の最小単位で以下を追加する。

1. Domain: score 計算
- 閾値境界（69/70, 39/40）
- null 入力（`lastReleaseAt=null`, `contributors=null`）
- `scoreVersion=1` 出力保証

2. Domain/Application: 30 日差分
- 30 日前 snapshot あり/なし
- 同日重複 snapshot の upsert
- UTC 日付境界（00:00:00Z）

3. Infrastructure: GitHub 取得失敗
- 429 / 5xx / timeout で snapshot 不更新
- 部分失敗時に他 repo は継続処理

4. API Contract
- `GET /api/categories` 200 schema
- `GET /api/categories/:slug` 200/404 schema
- nullable フィールド（`issueGrowth30d`, `commitLast30d`, `lastCommit`）契約

5. UI
- タブ切替で API 再取得
- loading / error 表示
- healthScore 降順表示

## Risks / Trade-offs

- [Risk] 将来用カラムの先行追加で「未使用列」が増える  
  → Mitigation: Phase ごとに使用列を明文化し、未使用列は nullable + ドキュメント管理する。

- [Risk] scoreVersion を導入しても、クライアントが version 差異を意識しない可能性  
  → Mitigation: OpenAPI に `scoreVersion` を必須化し、互換ポリシーを明示する。

- [Risk] 日次ジョブ失敗で 30 日差分が欠損する  
  → Mitigation: upsert + 再実行導線（workflow_dispatch）を提供し、欠損時は `issueGrowth30d=null` を返す。

- [Risk] category seed が既存手動登録と重複する  
  → Mitigation: 一意キーと upsert 戦略で重複を回避し、関連付けのみ追加する。

- [Risk] Bus Factor proxy の算出コストが高くなる  
  → Mitigation: Phase 1 では算出失敗時 nullable を許容し、同期 API ではなく snapshot 更新時に集約する。

## Migration Plan

1. スキーマ migration を追加する。  
対象: `categories`, `repository_categories`, `repository_snapshots`（将来拡張列含む）。

2. Seeder を実装し、カテゴリと既定リポジトリの冪等登録を行う。  
完了条件: 複数回実行で重複なし、既存 `repositories` と共存可能。

3. domain/application を実装する。  
- health score 計算（`scoreVersion=1`）
- 30 日差分計算（UTC 規約）
- category ユースケース（一覧/詳細）

4. GitHub Actions 日次ジョブを追加する。  
完了条件: 同日重複保存防止、部分失敗許容、手動再実行可能。

5. API 契約と route を実装する。  
完了条件: `GET /api/categories`, `GET /api/categories/:slug` が OpenAPI 契約通りに応答する。

6. Frontend をカテゴリタブへ移行する。  
完了条件: タブ切替で API 呼び出し、表の新列表示、loading/error 表示が機能する。

7. 検証とロールバック方針を整備する。  
- 検証: シード冪等性、スコア計算、30 日差分、API 契約、UI 回帰
- ロールバック: 日次ジョブを無効化し、新規カテゴリ API を feature flag で停止可能にする

## Open Questions

- Bus Factor proxy の 2 指標（`distinct_committers_90d`, `top_contributor_ratio_90d`）を Phase 1 で実収集するか、列のみ先行にするか。
- `display_order` の初期値ルール（固定値ハードコード vs seed 定義ファイル化）をどちらにするか。
