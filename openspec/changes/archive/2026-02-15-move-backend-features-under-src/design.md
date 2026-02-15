## Context

現在の backend はエントリポイントと composition root を `apps/backend/src` に置いている一方、feature 実装は `apps/backend/features` 直下に分離されている。これにより backend パッケージ内の実装ルートが二重化し、探索時に `src` と `features` を横断する必要がある。現行の契約テストと architecture ドキュメントは `apps/backend/features/*` を feature 所有境界として固定しているため、再配置時は仕様・テスト・実装を同時更新する必要がある。

## Goals / Non-Goals

**Goals:**
- backend feature 所有境界を `apps/backend/src/features/*` に統一する
- API 契約と backend/batch/common の依存境界ルールを維持したまま、パス変更のみを安全に適用する
- contract test / tsconfig / architecture ドキュメントを新レイアウトへ同期する

**Non-Goals:**
- feature の責務分割や use-case の挙動変更
- `apps/common` への再抽出ルール変更
- frontend / batch の構成変更

## Decisions

- Decision: backend feature 配置を `apps/backend/src/features/*` へ移動する
  - Rationale: backend 実装を `src` 配下に統一し、`src` を単一ソースルートとして扱えるようにする。
  - Alternative considered: `apps/backend/features/*` を維持
    - 却下理由: `src` と feature で実装ルートが分かれ続け、探索・導線理解コストが高い。

- Decision: `@backend/*` alias は維持し、`paths` の解決対象を `./*` のまま使う
  - Rationale: import 文のプレフィックス規約を変えずに物理パス移動だけを反映できる。
  - Alternative considered: alias を `@backend/src/*` に変更
    - 却下理由: 全 import 規約が変わり変更面が過大。

- Decision: 契約テストは「feature 所有境界のディレクトリ存在・内容検査」の参照先だけ更新する
  - Rationale: 既存の境界保証ロジックを再利用しつつ、新レイアウトに追従できる。

## Risks / Trade-offs

- [Risk] import 解決漏れにより runtime/module not found が発生する
  - Mitigation: `rg` で旧パス参照を全件検査し、typecheck と backend contract test を実行する

- [Risk] 既存 OpenSpec change と architecture 記述の不整合が残る
  - Mitigation: 本 change の delta spec と `docs/architecture.md` を同時更新し、後続で `sync-specs` を実施する

- [Trade-off] 大量のファイル移動で差分可読性が一時的に低下する
  - Mitigation: 機械的な移動と参照更新に限定し、機能変更を含めない
