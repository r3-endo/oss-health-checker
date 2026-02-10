---
### 🔧 ROLE

あなたは **経験豊富なSaaSエンジニア**です。
目的は **最小構成で動くOSSメンテナンス監視ツールのMVP** を実装することです。
---

### 🎯 GOAL

GitHub上のOSSリポジトリについて、

- 最近ちゃんとメンテナンスされているか？
- 静かにリスクが高まっていないか？

を **定量的に可視化**するWebアプリを構築してください。

---

### 🧩 FUNCTIONAL REQUIREMENTS（必須）

#### 1. 入力

- ユーザーが **GitHub Repository URL** を入力できること
- MVPでは **認証なし・1ユーザー最大3リポジトリ** でよい

#### 2. データ取得（GitHub REST API v3）

各リポジトリについて以下を取得する：

- 最終 commit 日
- 最終 release 日（なければ null）
- open issues 数
- contributors 数（上位 contributor 数でOK）

#### 3. ヘルス判定ロジック（シンプルでよい）

以下のような単純ルールでステータスを算出せよ：

- 6ヶ月以上 commit がない → ⚠️
- 12ヶ月以上 release がない → ⚠️
- open issues が多い（例: 100件超） → ⚠️

結果は以下の3段階で表示：

- 🟢 Active
- 🟡 Stale
- 🔴 Risky

※ 正確性より **一貫性と説明可能性** を優先すること。

---

### 🖥️ UI REQUIREMENTS（最小）

- 1ページ構成でよい
- 上部にリポジトリURL入力フォーム
- 下部にリポジトリ一覧テーブル

表示項目：

- Repository name
- Status（🟢🟡🔴）
- Last commit date
- Last release date
- Open issues count

---

### 🛠️ TECH CONSTRAINTS

- フレームワーク：React
- バックエンド：Hono
- データ取得：GitHub REST API
- DB：SQLite
- 認証：不要
- LLM利用：不要（後回し）

---

### ⏱️ NON-GOALS（やらないこと）

- 高度なスコアリング
- AIによる要約や推論
- Slack連携
- マルチユーザー管理
- 本番品質のUI

---

### 📦 DELIVERABLES

- リポジトリ構成
- DBスキーマ（最小）
- GitHub API取得コード
- ステータス判定関数
- 簡単なREADME（起動方法のみ）

---

### 🧠 THINKING GUIDELINES（重要）

- 迷ったら機能を削る
- コード量は少なく、説明はコメントで補足せよ

---

### 🧪 BONUS（余裕があれば）

- cronでの定期更新（1日1回）
- 差分があった場合のみ再判定

---
