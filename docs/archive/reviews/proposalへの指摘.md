````markdown
# Phase 1 Proposal に対するレビューと修正提案

## 結論

現在の Phase 1 提案は方向性としては正しいです。  
しかし、

> 「カテゴリダッシュボード機能追加」

として進めると、将来 OSS Intelligence エンジンへ進化させる際に
データモデル・スコア設計・拡張性の面で再設計が発生する可能性が高いです。

Phase 1 は **UI改善フェーズではなく、基盤整備フェーズ** として再定義すべきです。

以下、修正すべき点を整理します。

---

# 1. Snapshot設計が将来拡張に耐えない

現在の想定:

```sql
repository_snapshots (
  repository_id,
  recorded_at,
  open_issues,
  commit_count_30d
)
```
````

## 問題

将来的に必要になる指標：

- commit_count_total
- contributor_count
- last_release_at
- release_count
- star_count
- fork_count
- bus factor proxy
- advisory_count

今の設計では Phase 2 以降でマイグレーションが頻発します。

---

## 修正案（Phase1でやるべき）

```sql
repository_snapshots (
  repository_id TEXT NOT NULL,
  recorded_at DATETIME NOT NULL,

  open_issues INTEGER,
  commit_count_30d INTEGER,
  commit_count_total INTEGER,
  contributor_count INTEGER,
  last_release_at DATETIME,
  release_count INTEGER,
  star_count INTEGER,
  fork_count INTEGER,

  PRIMARY KEY(repository_id, recorded_at)
);
```

すべて埋める必要はありませんが、
**将来使うカラムは今用意しておくべきです。**

---

# 2. Health Score が固定ロジックすぎる

現在：

- ハードコード減点方式
- 動的計算のみ
- バージョン管理なし

## 問題

将来スコアロジックが進化した場合：

- 過去との比較不能
- 「なぜこのスコアか？」の説明が困難
- バージョン管理不能

---

## 修正案

スコア関数にバージョンを導入：

```ts
calculateHealthScore(repo, (scoreVersion = 1));
```

また、snapshotに：

```sql
health_score_version INTEGER
```

を持たせることを推奨。

スコア値自体は保存不要でも、
**バージョンは持つべきです。**

---

# 3. Bus Factor 指標が弱い

現状：

- contributor数のみ

これは静的です。

## シニア視点で重要なのは：

- 直近90日で何人がコミットしているか
- 1人に偏っていないか

---

## 追加すべき指標

- distinct_committers_90d
- top_contributor_ratio_90d

これは Phase1 で入れておくべきです。

なぜなら：

> 単独メンテリスクは最重要シグナルの一つ

だからです。

---

# 4. Category設計が硬直的

現在：

- slug
- name

のみ。

## 将来的に必要になる可能性

- 表示順
- システムカテゴリとユーザカテゴリの区別
- 非表示フラグ
- キュレーション区分

---

## 修正案

```sql
categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT 1
);
```

軽微な変更で拡張性が大幅に向上します。

---

# 5. Dev Health と他レイヤの分離が明文化されていない

Phase1 は GitHubデータのみ。

しかし設計上：

- Dev Health
- Adoption
- Security
- Governance

を将来追加します。

---

## 必須アーキテクチャ方針

- GitHub adapter は raw signal を返すだけ
- scoring は抽象化された DTO に依存
- Adoption レイヤを後から差し込める設計

これを明文化してください。

---

# 6. 非目標（Non-Goals）が弱い

スコープクリープを防ぐため、明示すべき：

- npm未対応
- Maven未対応
- PyPI未対応
- Security advisory未対応
- Governance未対応
- 依存解析未対応

---

# 7. UI設計の将来互換性

今は Dev Health のみ表示。

将来は：

```
Dev Health
Adoption
Security
Governance
```

のレーダー表示になる可能性。

---

## 推奨

APIレスポンスを将来拡張可能な構造に：

```json
metrics: {
  devHealth: {...},
  adoption: null,
  security: null,
  governance: null
}
```

今は devHealth のみ埋める。

---

# 8. 今のProposalの良い点

- カテゴリ導入は正しい
- スナップショット導入は戦略的に正しい
- スコア数値化は正しい
- Clean Architecture意識あり
- トレンド表示は正しい

方向性は間違っていません。

---

# 最終判断

Phase1は進めて良い。

ただし以下を修正してから進めるべき：

- Snapshotスキーマ拡張
- Score version導入
- Bus factor proxy追加
- Category拡張フィールド追加
- Dev Healthレイヤであることを明文化

---

# Phase1の再定義

これは：

> Dev Health Radar 基盤構築フェーズ

です。

「カテゴリダッシュボード改修」ではありません。

---

# 確認事項

実装前に確認すべき問い：

1. Phase1はDev Healthのみで良いか？
2. 将来npmなどを取り込む前提で設計するか？
3. 今多少複雑になっても拡張性を優先するか？

これを決めてから実装に進むべきです。

```

```
