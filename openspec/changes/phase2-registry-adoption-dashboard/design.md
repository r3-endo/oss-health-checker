## Context

既存システムは `development-health` を中心に GitHub 由来シグナルを可視化しているが、採用実態（Adoption）指標は未提供である。`docs/architecture.md` では `development-health` と `ecosystem-adoption` を対等 feature とし、feature 内で `interface -> application -> domain` と `port/adapter` 境界を維持する方針が定義されている。

本変更では npm を初期対象に、`Repository` ごとの adoption データ（Package Name, Weekly Downloads, Δ7d, Δ30d, Last Published Date, Latest Version）を UI と API に追加する。初期版はスコアリングを導入せず一次情報を表示し、未マッピングは `Not Mapped` として明示する。

## Goals / Non-Goals

**Goals:**
- Dev Health と独立した `ecosystem-adoption` レイヤを追加し、同一ダッシュボード上で参照可能にする。
- npm を最初の provider として実装し、将来 provider（Maven Central/PyPI/Homebrew/Docker）追加時に application 層を変更しない設計にする。
- API 契約で未マッピングと外部依存失敗を区別可能にし、UI が安定して表示できるようにする。
- 生データ表示を維持し、欠損値/null を明示的に扱う。

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

## Risks / Trade-offs

- [Risk] npm API のレート制限や一時障害で取得失敗が増える → Mitigation: タイムアウト/リトライ方針を adapter に閉じ、失敗時は前回成功 snapshot を返す。
- [Risk] mapping 未設定が多いと adoption 列の有用性が低下する → Mitigation: `Not Mapped` を明示し、後続タスクで mapping 登録導線を追加可能な API 契約にする。
- [Risk] provider 追加時にレスポンス互換性が崩れる → Mitigation: provider 非依存の共通 adoption DTO を先に固定し、provider 固有項目は拡張フィールドに隔離する。
- [Risk] Dev Health と Adoption の取得タイミング差で情報鮮度がずれる → Mitigation: 各レイヤの `fetchedAt` を独立表示し、同時刻性を前提にしない。

## Migration Plan

1. schema 変更を追加（mapping + adoption snapshot）し、既存データに影響しない nullable/default 設計で適用する。
2. backend に `ecosystem-adoption` の use-case/port/provider(npm)/repository/interface を追加する。
3. `shared/bootstrap/build-container.ts` で provider registry と resolver を配線し、feature の use-case へ注入する。
4. `shared/bootstrap/build-app.ts` で ecosystem-adoption の route/controller を配線する。
5. repository 一覧 API の OpenAPI を拡張し、adoption フィールドを後方互換を保って追加する。
6. frontend model(zod) と API adapter を更新し、truth table に従った表示分岐と adoption 列を追加する。
7. 失敗系テスト（not mapped / provider failure / null field）を追加して CI を通す。
8. 段階的に有効化し、問題時は adoption 取得を feature flag または provider 無効化で切り戻す（Dev Health 機能は維持）。

## Open Questions

- package mapping の初期登録をどこで行うか（手動入力 / 設定ファイル / 自動推定）。
- npm downloads API の集計基準（週次定義、当日分遅延）を UI 文言でどこまで説明するか。
- adoption refresh のトリガーを Dev Health refresh と統合するか、独立操作にするか。
