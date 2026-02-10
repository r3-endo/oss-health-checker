# ER Diagram (Task 3)

MVP の変更容易性を優先し、`snapshots.warning_reasons_json` のような 1 カラム複合値は採用せず、警告理由を正規化した。

```mermaid
erDiagram
  repositories ||--o{ snapshots : has
  snapshots ||--o{ snapshot_warning_reasons : has

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
```

## Normalization Notes

- `repositories`:
  - リポジトリ固有属性のみを保持（URL・owner・name）。
- `snapshots`:
  - 時点依存の観測値を保持（signals/status/fetched_at）。
  - 履歴を失わない append-only 前提。
- `snapshot_warning_reasons`:
  - 1:N の警告理由を行として保持し、将来の理由追加・検索条件追加に対応しやすくした。

## Key Constraints

- `repositories.url` は一意。
- `snapshots.repository_id` は `repositories.id` への外部キー（`ON DELETE CASCADE`）。
- `snapshot_warning_reasons.snapshot_id` は `snapshots.id` への外部キー（`ON DELETE CASCADE`）。
- `status` は `Active|Stale|Risky` の CHECK 制約。
- `reason_key` は `commit_stale|release_stale|open_issues_high` の CHECK 制約。
