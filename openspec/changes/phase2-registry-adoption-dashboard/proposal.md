## Why

現在のダッシュボードは GitHub の Dev Health 指標に偏っており、実利用の継続性（Adoption）を評価できない。ライブラリ選定で必要な判断軸を補完するため、Phase 2 として Registry 由来の採用実態を可視化する必要がある。

## What Changes

- npm を初期対象として、Repository ごとの Adoption 情報（Package Name、Weekly Downloads、Downloads Δ 7d、Downloads Δ 30d、Last Published Date、Latest Version）を表示する。
- Dev Health レイヤとは独立した ecosystem-adoption レイヤを UI と API 契約に追加する。
- 集約境界を `dashboard-overview` に分離し、既存 `/api/repositories` への adoption 混在を段階的に解消する。
- 画面は 1 ページ統合ではなく、`Dashboard`（ハブ）/ `GitHub Health`（既存カテゴリ維持）/ `Registry Adoption`（新規）の 3 画面構成にする。
- `Dashboard` から `GitHub Health` と `Registry Adoption` へ遷移できる導線を提供する。
- 初期版は一次情報をそのまま表示し、スコアリングや加工ロジックは導入しない。
- パッケージ未対応時は "Not Mapped" を返却・表示する。
- 将来の Maven / PyPI / crates.io / Homebrew 追加を前提に、Registry 依存を拡張可能な境界（Port/Adapter）で設計する。

## Capabilities

### New Capabilities
- `registry-adoption-layer`: Registry（初期は npm）から取得した採用実態データを API で提供し、ダッシュボードで表示する能力。

### Modified Capabilities
- `maintenance-health-dashboard`: 既存の Dev Health 表示に加え、Adoption レイヤの列と "Not Mapped" 表示を扱う要件へ拡張する。

## Impact

- Backend: Registry Adoption 用の API schema、controller/service/repository/infrastructure（npm adapter）を追加し、外部失敗時のエラーハンドリング契約を定義する。
- Frontend: ハブ画面追加、GitHub Health 画面の維持、Registry Adoption 画面の新設、画面間導線の追加。
- API evolution: `/api/dashboard/repositories` を正規の統合 endpoint とし、`/api/repositories` は管理用途として維持しつつ adoption 統合は deprecate する。
- Data model: Repository と package mapping を扱うための永続化モデル/取得フローを追加または拡張。
- External dependency: npm Registry API（downloads と latest metadata）連携が追加される。
- Test/CI: 正常系に加えて、未マッピング・外部API失敗・null/欠損値の失敗系を受け入れ条件に含める。
