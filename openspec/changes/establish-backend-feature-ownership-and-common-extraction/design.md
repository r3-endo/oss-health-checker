## Context

これまでの移行で実行入口は `apps/*` 側へ寄せられたが、feature 実装の所有境界はまだ曖昧である。現在は shared 実装が先行しており、backend が本来所有すべき機能まで共通レイヤーに置かれやすい。

本 change では backend-first を採用し、feature 実装の一次所有を `apps/backend/features/*` に固定する。`apps/common` は「複数 app で本当に再利用される最小要素」だけに限定し、batch 側で必要になった処理のみを選択的に抽出する。

## Goals / Non-Goals

**Goals:**
- `apps/backend/features/*` を feature 実装の正規配置として確立する。
- `apps/common` を最小共有境界（shared-kernel / platform-db / cross-app service）として定義する。
- batch が必要な処理を backend 所有機能から選択的に抽出し、`apps/common` 経由で利用できるようにする。
- API 契約と日次収集結果を維持する。

**Non-Goals:**
- ルート直下 `backend` / `frontend` の物理削除（別 change）。
- Docker / compose 実装。
- ドメイン仕様や API レスポンス仕様の変更。

## Decisions

### 1. Feature 所有は backend-first に固定する
- 方針:
  - `development-health` / `ecosystem-adoption` / `dashboard-overview` などの feature 実装は `apps/backend/features/*` に配置する。
  - backend 専用実装（HTTP controller, route, presentation mapping）は `apps/backend` から外へ出さない。
- 理由:
  - 機能責任者を backend に固定し、設計判断の起点を明確化できる。
- 代替案:
  - 初期から全面共通化すると再利用性は高いが、責務の曖昧化と過剰抽象化を招くため不採用。

### 2. `apps/common` は選択的抽出のみ許可する
- 方針:
  - batch と backend の両方で使う実装に限り `apps/common` へ抽出する。
  - 抽出対象は `shared-kernel`（型・エラー・ユーティリティ）、`platform-db`（DB共通基盤）、再利用ユースケースに限定する。
- 理由:
  - 先に共通化するより、必要性ベースで抽出した方が凝集度を維持しやすい。
- 代替案:
  - ルールなしの common 拡張は肥大化リスクが高く不採用。

### 3. batch は backend 実装へ直接依存しない
- 方針:
  - `apps/batch` は `apps/backend/interface/http` および backend 内部実装へ直接 import しない。
  - batch が呼ぶ処理は `apps/common` に公開された抽出済み API に限定する。
- 理由:
  - 実行単位分離とテスト容易性を維持できる。
- 代替案:
  - batch→backend 直接依存は短期コストが低いが、境界崩壊を招くため不採用。

### 4. 変更はテスト先行の段階移行で進める
- 方針:
  - 先に境界テスト（所有位置、禁止 import）を追加して Red を確認し、最小移行で Green 化する。
  - PR は 1 change 内で A→D（テスト→実装→整理→最終検証）順を守る。
- 理由:
  - 配置変更の破壊リスクを小さくできる。

## Risks / Trade-offs

- [Risk] backend への集約で初期の移動差分が大きくなる  
  → Mitigation: feature 単位で移動し、1 feature ずつ import を完結させる。

- [Risk] `apps/common` の境界が再び肥大化する  
  → Mitigation: 抽出条件（複数 app で実際に利用）を tasks と review checklist に明記する。

- [Risk] batch の導線変更で収集ジョブが壊れる  
  → Mitigation: batch 実行テストと既存契約テストを同時に実施する。

- [Risk] 依存関係の循環が発生する  
  → Mitigation: `apps/common -> apps/backend` 禁止をテスト/lint で固定する。

## Migration Plan

1. 境界テストを追加（backend 所有と common 抽出条件、禁止 import）。
2. feature 実装を `apps/backend/features/*` へ再配置。
3. batch で必要な処理のみ `apps/common` に抽出し、batch import を切り替える。
4. ルート scripts/tsconfig/eslint/CI の参照を再配置後の経路へ更新。
5. `bun run typecheck` / `lint` / `test` と batch 実行検証を実施。

ロールバック方針:
- 問題の出た feature 単位で差分を revert し、前段の配置に戻す。
- API/DB schema を変えないためデータ移行ロールバックは不要。

## Open Questions

- `apps/common` の最小責務に含める具体ディレクトリ名（`shared-kernel`, `platform-db` など）の最終命名。
- feature ごとの移行順（`development-health` 先行か `ecosystem-adoption` 先行か）。
- CI の path filter を feature 配置後にどの粒度で最適化するか。
