## Context

`establish-backend-feature-ownership-and-common-extraction` で backend-first の再配置は完了したが、`apps/common` に backend 専用実装が約 29 ファイル残っている。現状は運用ルールベースで境界を維持しており、将来的に `apps/backend/features/*` と `apps/common/*` の責務が再び混線するリスクが高い。

本 change は、残存ファイルを backend 所有へ戻した上で、依存境界を contract test と lint で機械的に強制し、CI で継続検証する。

## Goals / Non-Goals

**Goals:**
- `apps/common` に残存する backend 専用ファイル（development-health 22、ecosystem-adoption 7）を `apps/backend/features/*` に移動する。
- `apps/batch -> apps/backend/interface/*` と `apps/common -> apps/backend/*` の禁止依存を自動検出する。
- `apps/common` への追加を「複数 app で実利用がある場合のみ」に固定する判定ルールを定義し、テストで担保する。
- 境界違反時に CI が即失敗する quality gate を確立する。

**Non-Goals:**
- API 契約、レスポンス仕様、DB スキーマの変更。
- Docker / compose の設計変更。
- 新規 feature 開発や domain ルール変更。

## Decisions

### 1. 境界を「規約」から「実行時に失敗するテスト」へ昇格する
- 方針:
  - contract test で禁止 import パターンを検査し、違反を即 fail する。
  - lint rule でも同じ禁止方向を二重化し、ローカル編集時にも早期検知する。
- 理由:
  - ドキュメント規約のみでは drift を止められないため。
- 代替案:
  - レビュー運用のみで抑止する案は、検出遅延と判断ばらつきが大きいため不採用。

### 2. backend 専用実装は feature 配下へ戻し、common は再利用核のみ残す
- 方針:
  - `apps/common/features/development-health` と `apps/common/features/ecosystem-adoption` のうち backend 専用 use-case / read-model / ports / adapters を `apps/backend/features/*` に移動する。
  - batch で実利用する契約だけを `apps/common` に残す。
- 理由:
  - 所有者を backend に固定し、common の肥大化と責務逆流を防止するため。
- 代替案:
  - 既存の common 集約を維持する案は短期コストは低いが、境界が継続的に崩れるため不採用。

### 3. `apps/common` 追加には「利用実績」証跡を必須化する
- 方針:
  - common 追加時は、最低 2 app からの import が確認できることをテスト観点にする。
  - 単一 app 専用コードは feature 配下へ戻す。
- 理由:
  - 抽象化の先行導入を抑え、変更容易性を維持するため。
- 代替案:
  - 設計レビュー承認のみで例外許可する案は、再現性が低く自動化に向かないため不採用。

### 4. quality gate は既存 backend CI 導線へ統合する
- 方針:
  - `bun run --filter oss-health-checker-backend lint/typecheck/test` で境界検証が常に走る状態にする。
  - 追加の境界テストは backend CI の必須ステップとして扱う。
- 理由:
  - 新規ワークフローを増やさず、既存運用で確実に検知させるため。
- 代替案:
  - 独立 CI job のみで運用する案は、実行漏れと保守コスト増のため不採用。

## Risks / Trade-offs

- [Risk] 29 ファイル移動で import 修正範囲が広くなる  
  → Mitigation: feature 単位（development-health → ecosystem-adoption）で段階移行し、各段でテストを通す。

- [Risk] common からの切り出しで batch 導線が壊れる  
  → Mitigation: `batch:snapshots` / `batch:adoption` を回帰テストに含める。

- [Risk] lint と contract test のルール重複で保守負荷が増える  
  → Mitigation: 禁止パターン定義を共通定数化し、両者で参照する。

- [Risk] 既存 spec と実コードの用語差異（apps/common vs apps/common）  
  → Mitigation: 本 change で `apps/common` に統一して spec を更新する。

## Migration Plan

1. 境界違反を検出する失敗テスト（禁止 import / common 追加条件）を先に追加する。
2. development-health の backend 専用 22 ファイルを `apps/backend/features/development-health` へ移動し import を更新する。
3. ecosystem-adoption の backend 専用 7 ファイルを `apps/backend/features/ecosystem-adoption` へ移動し import を更新する。
4. `apps/common` には cross-app 利用契約のみ残るよう整理し、batch 側 import を確認する。
5. lint/typecheck/test と batch 実行導線、API 契約テストを実行して CI gate と一致させる。

ロールバック方針:
- 不具合が出た feature 単位で移動差分を戻す。
- API/DB 仕様は不変のためデータロールバックは不要。

## Open Questions

- common 追加条件を「2 app import 実績」に固定するか、将来導線を見越した例外運用を許可するか。
- 境界検証を lint 中心にするか contract test 中心にするか（または同等重みで併用するか）。
- 将来 phase で `apps/common` の feature ディレクトリ命名を再編する必要があるか。
