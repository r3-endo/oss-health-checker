## Context

既存システムは `development-health` を中心に GitHub 由来シグナルを可視化しているが、採用実態（Adoption）指標は未提供である。`docs/architecture.md` では `development-health` と `ecosystem-adoption` を対等 feature とし、feature 内で `interface -> application -> domain` と `port/adapter` 境界を維持する方針が定義されている。

本変更では npm を初期対象に、`Repository` ごとの adoption データ（Package Name, Weekly Downloads, Δ7d, Δ30d, Last Published Date, Latest Version）を UI と API に追加する。初期版はスコアリングを導入せず一次情報を表示し、未マッピングは `Not Mapped` として明示する。

## Goals / Non-Goals

**Goals:**
- Dev Health と独立した `ecosystem-adoption` レイヤを追加し、`Dashboard` ハブ経由で各画面（GitHub / Registry）から参照可能にする。
- npm を最初の provider として実装し、将来 provider（Maven Central/PyPI/Homebrew/Docker）追加時に application 層を変更しない設計にする。
- API 契約で未マッピングと外部依存失敗を区別可能にし、UI が安定して表示できるようにする。
- 生データ表示を維持し、欠損値/null を明示的に扱う。
- 画面表示時のデータ入力を DB snapshot に固定し、表示リクエスト中に GitHub API / npm API を呼ばない。

**Non-Goals:**
- Adoption スコア算出、重み付け、ランキング機能。
- npm 以外 provider の本実装。
- 高度な時系列分析や予測値生成。
- Dev Health 既存評価ロジック（status分類・warning reason）の改変。

## Decisions

### 1. feature 境界: `ecosystem-adoption` を独立 feature として実装する
- Decision: backend に `features/ecosystem-adoption` を配置し、`development-health` とは別 use-case/port/repository/provider を持たせる。
- Rationale: 依存方向を固定し、GitHub 系ロジックへの偶発的結合を防ぐ。将来 provider 追加を feature 内で閉じられる。
- Alternatives considered:
  - `development-health` feature に adoption 関連を追加: 実装は早いが責務が混在し将来拡張時に変更範囲が肥大化するため不採用。

### 2. provider 拡張方式: `RegistryProviderPort` + provider registry（plugin 方式）
- Decision: `application/ports/registry-provider-port.ts` を中心に provider を抽象化し、`npm` 実装を `infrastructure/providers/npm` に配置する。use-case は `RegistryProviderResolverPort` で provider 識別子を解決する。
- Rationale: Open/Closed 原則を満たし、provider 追加を adapter 追加で完結させる。
- Composition Root: provider の登録/解決配線は `shared/bootstrap/build-container.ts` に集約し、`build-app.ts` は HTTP route 接続のみを担う。use-case 内で具象 provider の生成は行わない。
- Alternatives considered:
  - use-case 内の `switch(provider)` 分岐: 初期は簡単だが provider 増加で分岐が肥大化しテスト容易性が落ちるため不採用。

### 3. API 契約: adoption は read model として repository 一覧レスポンスに統合する
- Decision: ダッシュボード取得 API で repository 行に `adoption` セクションを追加し、以下を返す。
  - mapped/success: `mappingStatus = "mapped"`, `adoptionFetchStatus = "succeeded"`, データ項目 (`packageName`, `weeklyDownloads`, `downloadsDelta7d`, `downloadsDelta30d`, `lastPublishedAt`, `latestVersion`) を返す
  - mapped/failure: `mappingStatus = "mapped"`, `adoptionFetchStatus = "failed"`（前回成功スナップショットがあればそれを返却）
  - not mapped: `mappingStatus = "not_mapped"`, `adoptionFetchStatus = "not_applicable"`（データ項目は `null`）
- Rationale: UI は 1 回の取得で Dev Health と Adoption を同時表示でき、表示ロジックを単純化できる。
- Contract rule: OpenAPI と zod を単一ソースとし、以下の truth table 以外の組み合わせを禁止する。

| mappingStatus | adoptionFetchStatus | Meaning |
| --- | --- | --- |
| `mapped` | `succeeded` | マッピング済み・取得成功 |
| `mapped` | `failed` | マッピング済み・取得失敗（前回成功値を表示可） |
| `not_mapped` | `not_applicable` | マッピング未設定 |

- Alternatives considered:
  - Adoption 専用別 API: API/Query が増え UI 側で join が必要になるため初期版では不採用。

### 4. データモデル: repository-package mapping と adoption snapshot を分離
- Decision: 永続化は以下 2 種を持つ。
  - Mapping: repository と package 名の関連（未設定を許容）
  - Snapshot: provider から取得した adoption 値と取得時刻
- Rationale: 未マッピング状態と取得失敗状態を明確に分離でき、将来複数 provider を追加しても snapshot を provider 単位で蓄積できる。
- Alternatives considered:
  - repository テーブルに adoption 列を直接追加: schema 変更コストは低いが provider 拡張と履歴保持に弱いため不採用。

### 5. 失敗時の扱い: 「前回成功値の保持」と「失敗状態の明示」を両立
- Decision: 外部 API 失敗時は snapshot を上書きせず、application error を正規化して返す。UI には更新失敗を示しつつ既存値を表示する。
- Rationale: 既存の refresh failure 方針と整合し、運用時の可用性を高める。
- Alternatives considered:
  - 失敗時に null で上書き: データ欠落を招き、実態より悪い表示になるため不採用。

### 6. フロント実装: feature-based + TanStack Query の既存規約に従う
- Decision: `frontend/src/features/repositories` 配下で model(zod)・api(adapter)・hooks(query)・ui を拡張し、UI は adapter 具象エラーに依存しない。
- Rationale: 既存設計を維持し、追加変更を局所化できる。
- Alternatives considered:
  - ページに直接 HTTP 呼び出しを追加: 実装は速いがテスト性と再利用性を損なうため不採用。

### 7. 変更影響を局所化するため、集約境界を `dashboard-overview` へ分離する
- Decision: `development-health` と `ecosystem-adoption` は独立 read model を返す feature とし、テーブル表示用の join は backend `features/dashboard-overview` に集約する。frontend も `features/dashboard` を新設し、統合表示はこの feature だけが担う。
- Rationale: 今回のような adoption 拡張時に `development-health` / `repositories` の既存契約へ波及しないようにし、変更点を集約 feature に閉じ込める。
- API policy:
  - 既存 `/api/repositories` は後方互換のため当面維持（管理用途）
  - 新規 `/api/dashboard/repositories` を統合 read model の正規 endpoint とする
  - frontend のダッシュボード表示は段階的に `/api/dashboard/repositories` へ移行する
- Alternatives considered:
  - 現行の `/api/repositories` に統合を継続: 実装は早いが feature 境界を跨ぐ差分が継続し、今後の機能追加でも同じ問題を繰り返すため不採用。

### 8. 画面設計: 1ページ統合をやめ、ハブ + 機能別ページに分離する
- Decision: frontend は以下 3 画面に分離する。
  - `Dashboard`（ハブ）: GitHub Health / Registry Adoption への導線とサマリのみ
  - `GitHub Health`（既存）: `LLM / backend / frontend` のカテゴリ表示を維持
  - `Registry Adoption`（新規）: package adoption の一覧と状態表示を集約
- Rationale: 情報密度を適正化し、閲覧目的ごとの認知負荷を下げる。feature 境界と画面責務を一致させ、UI 変更時の影響を局所化する。
- Alternatives considered:
  - 1ページに Dev Health + Adoption を同居: 一覧視認性が低下し、列追加に伴う可読性悪化が大きいため不採用。

### 9. 表示系の入力源を DB snapshot に固定し、外部API取得は日次バッチへ分離する
- Decision: `Dashboard` / `GitHub Health` / `Registry Adoption` の描画 API は DB に保存された最新 snapshot のみを参照する。GitHub API / npm API の呼び出しは表示処理から分離し、毎朝 1 回の収集ジョブで実行する。
- Rationale: 画面表示のレイテンシを安定化し、外部システム障害やレート制限の影響をユーザー操作から切り離す。
- Batch policy:
  - GitHub signals は既存 `jobs/collect-daily-snapshots.ts` を継続利用する。
  - Adoption signals は repository mapping を起点に npm API から収集し、`adoption_snapshots` を更新する日次ジョブを追加する。
  - 収集失敗時は前回成功値を保持し、`adoptionFetchStatus="failed"` を保存/返却する。
- Alternatives considered:
  - 画面表示時に都度 fetch: 最新性は高いが、表示遅延と外部依存の増大、失敗時の UX 悪化が大きいため不採用。

## Risks / Trade-offs

- [Risk] npm API のレート制限や一時障害で取得失敗が増える → Mitigation: タイムアウト/リトライ方針を adapter に閉じ、失敗時は前回成功 snapshot を返す。
- [Risk] mapping 未設定が多いと adoption 列の有用性が低下する → Mitigation: `Not Mapped` を明示し、後続タスクで mapping 登録導線を追加可能な API 契約にする。
- [Risk] provider 追加時にレスポンス互換性が崩れる → Mitigation: provider 非依存の共通 adoption DTO を先に固定し、provider 固有項目は拡張フィールドに隔離する。
- [Risk] Dev Health と Adoption の取得タイミング差で情報鮮度がずれる → Mitigation: 各レイヤの `fetchedAt` を独立表示し、同時刻性を前提にしない。
- [Risk] 集約境界の移行中に endpoint が二重化し、利用側が混在する → Mitigation: `/api/dashboard/repositories` を段階導入し、切替完了後に旧経路の adoption 参照を削除する（移行期間は contract test で両者差分を監視）。
- [Risk] 画面分離により導線が増え、利用者が目的画面へ迷う可能性 → Mitigation: `Dashboard` を単一入口にし、各画面への明示的ナビゲーションを固定配置する。
- [Risk] 日次更新と表示時刻のずれでデータが古く見える可能性 → Mitigation: `fetchedAt` を表示し、「毎朝更新」の運用前提を UI 文言に明示する。

## Migration Plan

1. schema 変更を追加（mapping + adoption snapshot）し、既存データに影響しない nullable/default 設計で適用する。
2. backend に `ecosystem-adoption` の use-case/port/provider(npm)/repository/interface を追加する。
3. `shared/bootstrap/build-container.ts` で provider registry と resolver を配線し、feature の use-case へ注入する。
4. `shared/bootstrap/build-app.ts` で ecosystem-adoption の route/controller を配線する。
5. repository 一覧 API の OpenAPI を拡張し、adoption フィールドを後方互換を保って追加する。
6. frontend model(zod) と API adapter を更新し、truth table に従った表示分岐と adoption 列を追加する。
7. 失敗系テスト（not mapped / provider failure / null field）を追加して CI を通す。
8. 段階的に有効化し、問題時は adoption 取得を feature flag または provider 無効化で切り戻す（Dev Health 機能は維持）。
9. backend に `features/dashboard-overview` を追加し、`development-health` / `ecosystem-adoption` の read model を join する統合 use-case + endpoint `/api/dashboard/repositories` を導入する。
10. frontend に `features/dashboard`（ハブ）と `features/registry-adoption`（新規画面）を追加し、`features/repositories` は GitHub Health 画面として維持する。
11. ルーティングを導入し、`Dashboard` から `GitHub Health` と `Registry Adoption` へ遷移可能にする。
12. `Registry Adoption` 画面は `/api/dashboard/repositories`（または将来 `/api/registry/repositories`）を利用し、adoption 列と失敗状態表示を担う。
13. 移行完了後、`development-health` の repository list read model から adoption 統合責務を削除し、独立性を回復する。
14. `ecosystem-adoption` に日次収集 use-case/job を追加し、mapping 済み repository を対象に npm API から `adoption_snapshots` を更新する。
15. 運用基盤（cron/GitHub Actions scheduler など）で GitHub signals と Adoption signals の日次ジョブを毎朝実行する。
16. 表示 API のテストで「外部API非依存（DB read only）」を固定し、回帰を防止する。

## Open Questions

- package mapping の初期登録をどこで行うか（手動入力 / 設定ファイル / 自動推定）。
- npm downloads API の集計基準（週次定義、当日分遅延）を UI 文言でどこまで説明するか。
- 「毎朝」の実行基準時刻を UTC/JST のどちらで固定するか。
