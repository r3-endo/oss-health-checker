# oss-maintenance-visibility-mvp tasks レビュー

対象:
- `openspec/changes/oss-maintenance-visibility-mvp/tasks.md`

## Findings（重要度順）

1. **Medium**: 失敗系の検証タスクが不足  
`3.4` と `6.5` で「refresh失敗時に前回snapshot維持」を実装する前提はあるが、検証タスクに失敗系の統合テストがない。回帰しやすい箇所。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:19`, `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:40`, `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:45`

2. **Medium**: `last_release_at = null` の分類境界テストが不足  
仕様上重要な「releaseなし」の取り扱いに対して、`7.1` は境界条件テストを掲げるのみで具体化されていない。`null`ケースを明示しないと実装解釈が割れる。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:44`

3. **Low**: `contributors_count` の扱いがAPI/UIで不明確  
取得は必須タスク化されているが、API返却・UI表示のどちらで使うかがタスク上は曖昧（`5.2` の「latest snapshot fields」に含む意図は読めるが明文化が弱い）。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:16`, `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:30`, `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:38`

## 補足

- 前回レビューで挙げた「一覧API契約」「理由表示」「閾値境界」は、`5.2` `6.4` `4.1` でタスク化済み。  
参照: `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:23`, `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:30`, `openspec/changes/oss-maintenance-visibility-mvp/tasks.md:39`
