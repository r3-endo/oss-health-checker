# oss-maintenance-visibility-mvp 仕様レビュー

対象:
- `openspec/changes/oss-maintenance-visibility-mvp/specs`
- `openspec/changes/oss-maintenance-visibility-mvp/design.md`

## Findings（重要度順）

1. **High**: 一覧取得APIの要件がspecに明示されていない  
`design.md`では `GET /repositories` が最小APIとして定義されているが、`specs`側は「一覧表示できること」止まりで、API契約（最新snapshotを返す等）が要求として固定されていない。実装差異が出やすい。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/design.md:49`, `openspec/changes/oss-maintenance-visibility-mvp/design.md:51`, `openspec/changes/oss-maintenance-visibility-mvp/specs/maintenance-health-dashboard/spec.md:3`

2. **High**: 「判定根拠の表示」がUI要件として落ちていない  
設計のゴールは「結果と根拠を表示」だが、ダッシュボードspecはステータス値表示のみで、どの警告条件が発火したかの表示要件がない。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/design.md:12`, `openspec/changes/oss-maintenance-visibility-mvp/design.md:60`, `openspec/changes/oss-maintenance-visibility-mvp/specs/maintenance-health-dashboard/spec.md:17`, `openspec/changes/oss-maintenance-visibility-mvp/specs/maintenance-status-classification/spec.md:33`

3. **Medium**: しきい値境界の定義が曖昧（`>` か `>=` か）  
specは「6ヶ月より古い」「12ヶ月より古い」と読めるが、設計文言は「6ヶ月 commit 無し / 12ヶ月 release 無し」で、境界日当日の扱いが解釈分かれする。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/design.md:5`, `openspec/changes/oss-maintenance-visibility-mvp/specs/maintenance-status-classification/spec.md:7`, `openspec/changes/oss-maintenance-visibility-mvp/specs/maintenance-status-classification/spec.md:11`

4. **Medium**: 取得失敗系（rate limit/APIエラー）時の期待動作がspec化されていない  
設計ではrate limitリスクを認識しているが、specには失敗時の応答・既存スナップショット維持・UI表示などの受け入れ条件がない。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/design.md:57`, `openspec/changes/oss-maintenance-visibility-mvp/specs/repository-signal-ingestion/spec.md:6`

## 結論

- 大枠（MVPでやりたい機能）は `specs` に概ね落ちている。  
- ただし、上記4点は「実現したいことを実装でブレなく再現する」には不足。特に **一覧API契約** と **判定根拠のUI表示** は目的に直結するため、追加を推奨する。

## Open Questions

1. 判定根拠は「APIレスポンスに含める」だけでなく、UI上にも必須表示か？
2. しきい値は厳密に `>= 6ヶ月 / >= 12ヶ月` で固定するか？
3. GitHub API失敗時は「前回値を表示して更新失敗を通知」方針でよいか？
