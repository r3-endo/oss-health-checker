本リポジトリは **OpenSpec** を用いた仕様駆動開発を行う。
LLM（Claude / Codex / Cursor など）を **複数サブエージェント**として運用し、親エージェントのコンテキスト消費を抑えつつ、計画と実行を分離する。

---

## 0. 原則（最重要）

- **仕様（Spec）を唯一の真実（Single Source of Truth）**とする
  - 実装議論・タスク分解・レビューは Spec から派生させる
- **Plan と Execute を分離**する
  - 親エージェント（Orchestrator）は「計画」「検証」「意思決定」のみ
  - 実装は必ずサブエージェントへ委譲する
- **コンテキスト節約のための制約**
  - サブエージェントには「必要最小限の抜粋」だけ渡す
  - 長い会話ログは渡さない。Spec と該当ファイルへの参照のみ
  - 出力は必ず「差分」「変更点要約」「テスト結果」に限定する

---

## 1. 実装運用ルール（TDD / CI）

- **TDDで進める（Red → Green → Refactor）**
  - 実装前に失敗するテストを先に作る
  - 1タスクごとに最小実装でテストを通し、その後にリファクタする
- **CIの品質ゲートを早期に整備する**
  - ローカル実行コマンドと CI 実行コマンドを一致させる
- **失敗系を必ず仕様化・テストする**
  - API失敗、外部依存失敗、境界値（null含む）は受け入れ条件に含める

---

## 2. 技術スタック方針

- **パッケージマネージャーは Bun を使用する**
  - ローカル実行・CIともに `bun install` / `bun run <script>` を使用する
- **Frontend**
  - Feature-based 構成
  - サーバー状態取得: TanStack Query
  - 状態管理: Jotai（共有UI状態が必要な場合に限定）
  - バリデーション: Zod
  - Frontend は API Port/Adapter 経由で Backend と疎結合に保つ
- **Backend**
  - Layered Architecture（controller / service(use-case) / repository / infrastructure）
  - DB/外部依存は Port/Adapter で抽象化し、差し替え可能にする
  - ORM: Drizzle
  - API Schema: OpenAPI（zod-openapi）
  - 変更が発生しやすい境界は immutable なデータ構造を優先する
