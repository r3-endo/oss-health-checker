## Context

`apps/*` ベースの新レイアウトは導入済みだが、ルート直下の `backend` / `frontend` も残っており、開発者がどちらを正式導線として使うべきかが曖昧な状態である。現状は CI・ローカル実行・ドキュメントの一部で旧導線を参照する余地があり、次段階の `packages/common` 分割時に変更点が散らばるリスクが高い。

本 change は「実装責務を apps に寄せる第一段階」として、`apps/*` を正式導線に固定し、ルート直下 `backend` / `frontend` は移行期間の互換レイヤーへ縮退する。物理削除は別 change（Phase 4）で実施する。

## Goals / Non-Goals

**Goals:**
- 実行・開発・CI の入口を `apps/backend` `apps/frontend` `apps/batch` に統一する。
- ルート直下 `backend` / `frontend` を「互換用途のみ」の状態に限定し、新規実装流入を防ぐ。
- API 契約と batch 収集結果を維持し、構成変更による振る舞い変更を起こさない。
- 以降の change で安全に物理削除できるよう、旧導線参照を棚卸し可能な状態にする。

**Non-Goals:**
- `packages/common` の feature 分割（次 change で実施）。
- ルート直下 `backend` / `frontend` の物理削除（Phase 4 で実施）。
- Dockerfile / `compose.yml` 実装。
- API 仕様やドメインルールの変更。

## Decisions

### 1. 正式導線は root scripts + `apps/*` 実体に一本化する
- 方針:
  - ルート `package.json` を唯一の開発入口として維持し、実行先は `apps/*` に固定する。
  - CI もルートコマンドを入口にし、`apps/*` を実行対象にする。
- 理由:
  - 開発導線の統一で認知負荷を下げる。
  - 次 change で package 分割しても、入口変更を再度行う必要がない。
- 代替案:
  - app 個別コマンドを直接実行する運用は柔軟だが、チーム運用時に入口が分散して逸脱しやすいため不採用。

### 2. 旧 `backend` / `frontend` は互換レイヤーとして短期間維持する
- 方針:
  - 旧ディレクトリ配下は「委譲・互換説明」のみ許可し、機能追加は禁止する。
  - README/architecture/tasks に「旧導線は段階的廃止」の注記を追加する。
- 理由:
  - 一気に削除すると現行ジョブ/ローカル手順の破壊リスクが高い。
  - 段階移行により PR を小さく保てる。
- 代替案:
  - 即時削除は理想的だが、依存の見落とし時に復旧コストが高く不採用。

### 3. 互換維持を契約テストで固定する
- 方針:
  - API 契約テスト・境界テストを維持し、導線変更による振る舞い差分を検知する。
  - 旧導線に新規 TS 実装が増えていないことをテスト/レビュー観点で確認する。
- 理由:
  - レイアウト変更は破壊的になりやすく、契約テストでの早期検知が必須。
- 代替案:
  - 手動確認のみでは見落としが増えるため不採用。

### 4. 変更は 1 change = 1 PR の中で A→D 手順を踏む
- 方針:
  - A: テスト・検証観点追加
  - B: 最小実装で導線統一
  - C: 参照整理・互換注記
  - D: docs/最終検証
- 理由:
  - CI を常に Green に保ちつつ、レビュー単位を維持できる。

## Risks / Trade-offs

- [Risk] 旧導線に依存する hidden script が残る  
  → Mitigation: 参照検索（`backend/`, `frontend/` 直参照）を tasks に含め、差分レビューでチェックリスト化する。

- [Risk] 互換レイヤーを残すことで移行完了が先送りされる  
  → Mitigation: Phase 4 change を同時起票し、削除完了条件を先に固定する。

- [Risk] ルート scripts の変更で CI 実行時間が増える  
  → Mitigation: filter 実行を維持し、必要 job のみ対象化する。

- [Risk] 「apps が公式入口」という認識が徹底されない  
  → Mitigation: README と architecture に明記し、旧導線への機能追加禁止を合意事項にする。

## Migration Plan

1. 入口統一の失敗系テスト/境界チェックを追加（旧導線に新規実装が混入しないことを検証）。
2. ルート scripts / CI / docs を `apps/*` 導線へ統一。
3. 旧 `backend` / `frontend` は互換委譲・注記のみに縮退。
4. API 契約テストを含む全テストを実行して互換を確認。
5. 次 change（package 分割）へ進む。

ロールバック方針:
- 問題発生時は本 change の PR を revert し、旧導線を一時復活させる。
- データ構造は変更しないため、DB ロールバックは不要。

## Open Questions

- 旧 `backend` / `frontend` を互換レイヤーとして何サイクル維持するか（目標期限）。
- 互換レイヤーで許容する最小ファイル構成（README のみ / script 委譲含む）。
- CI path filter を apps 中心に再最適化するタイミング（Phase 2 以降との整合）。
