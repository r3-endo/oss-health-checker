# phase2-registry-adoption-dashboard tasks レビュー（2026-02-13）

対象:
- `openspec/changes/phase2-registry-adoption-dashboard/tasks.md`
- 参照: `docs/architecture.md`

## Findings

### 1. [Medium] エラーマッピング実装タスクが欠落
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:15`, `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:19`
- 参照箇所: `docs/architecture.md:44`
- 内容: backend 実装タスクは `route/controller` まで定義されているが、`ApplicationError` の正規化を HTTP へ変換する feature 側 `error-mapper.ts` の実装・検証タスクがない。
- 影響: エラー契約が use-case ごとに分散し、API レスポンスの一貫性が崩れるリスクがある。
- 修正提案: `3.x` に「`interface/http/error-mapper.ts` 実装」「エラーコード変換の契約テスト」を追加する。

### 2. [Medium] 切り戻し戦略（feature flag / provider 無効化）の実装タスクがない
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:19`, `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:33`
- 内容: 段階的有効化や問題時の切り戻しを実現するための実装・設定・検証タスクが tasks に明記されていない。
- 影響: 本番運用時に障害回避のオペレーションが手作業依存になり、復旧時間が延びる。
- 修正提案: `3.x` または `5.x` に「adoption provider 有効/無効設定」「無効時の挙動テスト」を追加する。

### 3. [Low] TDD の実行順が曖昧で、実装先行になりうる
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:13`, `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:21`, `openspec/changes/phase2-registry-adoption-dashboard/tasks.md:28`
- 内容: テストタスクが章末に集約されており、`3.*`/`4.*` 実装後にテスト追加する運用でも成立してしまう。
- 影響: Red→Green の強制力が弱くなり、仕様差分の早期検出が遅れる。
- 修正提案: 各実装タスクに対して「先に失敗テスト作成」を対で配置し、順序を明示する（例: `3.1a test`, `3.1b impl`）。

## Overall
- 状態モデル、DI 配線、失敗系テスト観点は押さえられており、実装計画の骨格は妥当。
- 上記 3 点を補強すると、architecture 準拠と TDD 運用の確実性が高まる。
