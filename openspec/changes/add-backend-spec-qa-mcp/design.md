## Context

この変更は、backend 実装を一次根拠にしたビジネスロジック QA を MCP 経由で提供するための設計である。現状は質問ごとにコード読解が必要で、回答品質が担当者依存になりやすい。  
本リポジトリは Spec 駆動を原則とするため、MVP では Code 優先で回答しつつ Spec との差分を機械的に可視化し、後続の仕様同期につなげる。

制約:
- MVP スコープは backend のみ
- 回答は根拠付き（code path:line + spec path）で返す
- Spec 不一致時は回答継続 + `spec_mismatch=true`
- 実行時データ依存の質問は非対応
- クライアント間互換のため、MCP レスポンスは JSON スキーマ契約を固定する

## Goals / Non-Goals

**Goals:**
- IDE/エージェントから呼べる MCP QA インターフェースを提供する。
- ビジネスロジック質問に対して、構造化レスポンスを返す。
- 根拠抽出と回答生成を分離し、検索戦略やモデルを差し替え可能にする。
- Spec 不一致を明示し、仕様保守フローに接続できるようにする。

**Non-Goals:**
- frontend/インフラ領域の QA 対応
- DB 実データや外部 API の現在状態に依存する正誤判定
- 自動修正や自動コミット
- 完全な自然言語理解（MVP は質問タイプをビジネスロジック中心に限定）

## Decisions

1. MCP ツールを 2 層に分離する  
- Decision: `find_logic_evidence`（根拠抽出）と `ask_logic_qa`（回答生成）を分離する。  
- Rationale: 検索・ランキング改善と回答テンプレート改善を独立して進化させられる。  
- Alternative considered: 単一ツールで抽出と生成を一体化。  
- Why not: MVP は早いが、改善時に回帰範囲が広くなる。

2. Code 優先の証拠解決  
- Decision: 回答の一次根拠は backend コードとし、Spec は整合性チェック用途で併記する。  
- Rationale: 実行実態に最も近い情報を優先できる。  
- Alternative considered: Spec 優先。  
- Why not: 現時点で実装先行の差分を見逃す可能性がある。

3. 出力フォーマットは JSON 固定  
- Decision: `answer`, `evidence`, `confidence`, `spec_mismatch`, `unknowns` を必須とする。  
- Rationale: MCP クライアント間での再利用性と機械可読性を確保できる。  
- Alternative considered: Markdown 優先。  
- Why not: 人間可読性は高いが、IDE連携や自動評価に不向き。

4. Scope フィルタの明示  
- Decision: 初期検索対象を `backend/**`, `openspec/specs/**`, `openspec/changes/<change>/specs/**` に固定し、優先順位は `code > change specs > main specs` とする。  
- Rationale: ノイズを下げ、回答一貫性を担保する。  
- Alternative considered: 全リポジトリ横断検索。  
- Why not: MVP では誤検出率とコストが上がる。

5. 層間I/O契約を固定する
- Decision: 2ツール間で受け渡す evidence の最小スキーマを固定する。
- Rationale: 将来の検索実装差し替え時に `ask_logic_qa` 側の互換性を維持できる。
- Alternative considered: 内部表現を自由形式で受け渡す。
- Why not: 実装は速いが、拡張時に破壊的変更が発生しやすい。

## Interface Contracts

### `find_logic_evidence`

- Input:
  - `question: string` (required)
  - `scope: "backend"` (required, MVP 固定値)
  - `max_evidence: number` (optional, default 8, range 1-20)
- Output:
  - `evidence: EvidenceItem[]` (required)
  - `unresolved_reasons: string[]` (required)
  - `search_scope: string[]` (required)

`EvidenceItem`:
- `id: string`
- `kind: "code" | "spec"`
- `path: string`
- `line: number | null`
- `excerpt: string` (<= 240 chars)
- `relevance: number` (0.0-1.0)
- `source_priority: 1 | 2 | 3` (`1=code`, `2=change specs`, `3=main specs`)

### `ask_logic_qa`

- Input:
  - `question: string` (required)
  - `evidence: EvidenceItem[]` (required, empty 可)
- Output:
  - `answer: string`
  - `evidence: AnswerEvidence[]`
  - `confidence: number` (0.0-1.0)
  - `spec_mismatch: boolean`
  - `unknowns: string[]`
  - `status: "ok" | "insufficient_evidence" | "out_of_scope"`

`AnswerEvidence`:
- `kind: "code" | "spec"`
- `path: string`
- `line: number | null`
- `claim: string` (回答中のどの主張を裏付けるか)

## Rules

### 非対応質問判定（out-of-scope）

次のいずれかに該当した場合、`status="out_of_scope"` とし、`answer` は対象外理由を返す:
- 実行時データの現在値を要求する（例: 現在のDB件数、外部APIの最新レスポンス）
- backend 外領域のみを対象とする（frontend デザイン仕様のみ等）
- 運用手順や人手判断のみで決まる質問（コード/Specから再現不能）

### `spec_mismatch` 判定

`spec_mismatch=true` とする条件:
- 高関連度 code evidence（`relevance >= 0.7`）が示す振る舞いと、
- 対応する spec evidence が示す SHOULD/MUST 要件が矛盾する

矛盾が検出された場合でも回答は返し、`unknowns` に以下を追記する:
- `mismatch:<spec-path>:<code-path>`

### `confidence` 算出（MVP）

- 初期値: `0.5`
- code evidence 1件ごとに `+0.1`（最大 `+0.3`）
- spec evidence 1件ごとに `+0.05`（最大 `+0.15`）
- `spec_mismatch=true` の場合 `-0.25`
- `evidence=0件` の場合 `status="insufficient_evidence"`, `confidence=0.0`
- 最終値は `[0.0, 1.0]` に clamp

## Risks / Trade-offs

- [Risk] Code 優先により Spec 駆動原則が形骸化する  
  → Mitigation: `spec_mismatch` を必須項目にし、CIで mismatch 件数と未解消日数をメトリクス化する。

- [Risk] 根拠抽出の精度不足で誤回答する  
  → Mitigation: `confidence` と `unknowns` を返し、根拠不足時は断定を避ける。

- [Risk] 質問の自由度が高すぎて MVP の範囲を超える  
  → Mitigation: 質問タイプを判定条件/失敗条件/制約ルールに限定し、対象外は明示する。

- [Risk] path:line 参照がコード更新で陳腐化する  
  → Mitigation: 取得時点の参照として扱い、再実行で再解決できる設計にする。

- [Risk] クライアントが独自解釈で契約外レスポンスを期待する
  → Mitigation: JSON スキーマを公開し、互換性ルール（後方互換のみ）を定義する。

## Migration Plan

1. `find_logic_evidence` を実装し、I/O スキーマ準拠テストを追加する。  
完了条件: 入力バリデーション、`EvidenceItem` 形式、`search_scope` 出力を満たす。
2. `ask_logic_qa` を実装し、構造化出力を結合する。  
完了条件: `status` 3種（`ok`/`insufficient_evidence`/`out_of_scope`）を返せる。
3. Spec 整合チェックを追加し、`spec_mismatch` 判定ルールを統合する。  
完了条件: 意図的に矛盾させたテストケースで `spec_mismatch=true` となる。
4. 受け入れテストを実施する。  
完了条件:
  - 判定条件質問で根拠2件以上を返す
  - 失敗条件質問で `unknowns` が空または理由付きで埋まる
  - 根拠0件時に `insufficient_evidence` を返す
  - 非対応質問で `out_of_scope` を返す
5. ロールアウトとロールバック手順を適用する。  
ロールアウト: ツール名を `v1` で公開。  
ロールバック: `v1` を disable し、クライアントには `not_available` を返す（破壊的削除はしない）。

## Open Questions

- `excerpt` の長さ上限を 240 chars から調整する必要があるか。
- `mismatch` の重大度レベル（warning/error）を導入するか。
- `confidence` を将来モデル依存スコアへ置き換える際の互換方針をどうするか。
