# ER Diagram (Category Base)

カテゴリ基盤の導入に伴い、既存の監視テーブルに加えて `categories` / `repository_categories` / `repository_snapshots` を追加した。
既存の `snapshots` / `snapshot_warning_reasons` は継続利用し、用途を分離する。

```mermaid
erDiagram
  repositories ||--o{ snapshots : has
  snapshots ||--o{ snapshot_warning_reasons : has
  repositories ||--o{ repository_categories : classified_as
  categories ||--o{ repository_categories : includes
  repositories ||--o{ repository_snapshots : daily_snapshot

  repositories {
    text id PK
    text url UK
    text owner
    text name
    integer created_at
    integer updated_at
  }

  snapshots {
    text id PK
    text repository_id FK
    integer last_commit_at
    integer last_release_at "nullable"
    integer open_issues_count
    integer contributors_count
    text status "Active|Stale|Risky"
    integer fetched_at
  }

  snapshot_warning_reasons {
    text snapshot_id FK
    text reason_key "commit_stale|release_stale|open_issues_high"
    text PK "(snapshot_id, reason_key)"
  }

  categories {
    text id PK
    text slug UK
    text name
    integer display_order "default 0"
    integer is_system "boolean, default true"
    integer created_at
    integer updated_at
  }

  repository_categories {
    text repository_id FK
    text category_id FK
    integer created_at
    text PK "(repository_id, category_id)"
  }

  repository_snapshots {
    text repository_id FK
    text recorded_at "UTC date"
    integer open_issues
    integer commit_count_30d "nullable"
    integer commit_count_total "nullable"
    integer contributor_count "nullable"
    text last_commit_at "nullable"
    text last_release_at "nullable"
    integer release_count "nullable"
    integer star_count "nullable"
    integer fork_count "nullable"
    integer distinct_committers_90d "nullable"
    integer top_contributor_ratio_90d "nullable"
    integer health_score_version "nullable"
    text PK "(repository_id, recorded_at)"
  }
```

## Normalization Notes

- `repositories`:
  - リポジトリ固有属性のみを保持（URL・owner・name）。
- `snapshots`:
  - 時点依存の観測値を保持（signals/status/fetched_at）。
  - 履歴を失わない append-only 前提。
- `snapshot_warning_reasons`:
  - 1:N の警告理由を行として保持し、将来の理由追加・検索条件追加に対応しやすくした。
- `categories`:
  - カテゴリのマスタ情報（slug・表示順・システム管理フラグ）を保持する。
- `repository_categories`:
  - リポジトリとカテゴリの関連を中間テーブルで管理し、複数カテゴリ所属を許容する。
- `repository_snapshots`:
  - UTC日次で 1 repository 1 record を保証する時系列スナップショット。
  - Dev Health の 30日差分計算と将来指標拡張の入力を保持する。

## Key Constraints

- `repositories.url` は一意。
- `snapshots.repository_id` は `repositories.id` への外部キー（`ON DELETE CASCADE`）。
- `snapshot_warning_reasons.snapshot_id` は `snapshots.id` への外部キー（`ON DELETE CASCADE`）。
- `status` は `Active|Stale|Risky` の CHECK 制約。
- `reason_key` は `commit_stale|release_stale|open_issues_high` の CHECK 制約。
- `categories.slug` は一意。
- `repository_categories (repository_id, category_id)` は複合主キー（重複関連を禁止）。
- `repository_categories.repository_id` は `repositories.id` への外部キー（`ON DELETE CASCADE`）。
- `repository_categories.category_id` は `categories.id` への外部キー（`ON DELETE CASCADE`）。
- `repository_snapshots (repository_id, recorded_at)` は複合主キー（同一repo・同一UTC日の重複を禁止）。
- `repository_snapshots.repository_id` は `repositories.id` への外部キー（`ON DELETE CASCADE`）。
