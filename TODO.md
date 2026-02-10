# Overall

- 全体のライブラリを最新にする
- FrontendのQA回答MCP

# Backend

- Gateway責務過密

# Frontend

## 構築時のプロンプト

```txt
# Role
あなたはTypeScript、Hono、Reactに精通したシニア・フルスタック・エンジニア兼、UXスペシャリストです。
提供された「バックエンド・フロントエンド両層の設計思想」を憲法として遵守し、最高品質のコードを提供してください。

# 設計アーキテクチャ定義 (Must Follow)
## Frontend 設計
### 設計思想
- **Feature単位で閉じる**: 画面・API・model・hooksを `features/*` に集約する。
- **責務分離を優先**: ページは composition、表示は `ui/components`、サーバー通信は `api`、非同期状態は `hooks`。
- **依存注入で差し替え可能にする**: API adapter の concrete は `app` で組み立てる。
- **状態の原則を固定する**: サーバー状態は TanStack Query、UIローカル状態はコンポーネント内部。グローバルUI状態は必要時のみ導入する。


### ディレクトリ責務
#### `frontend/src/app`
- アプリ全体のProviderと依存注入を管理する。
- 例:
  - `providers.tsx`: QueryClient + API Provider の配線
  - `repository-api-provider.tsx`: `RepositoryApiPort` の注入境界
  - `query-client.ts`: query/mutation の共通ポリシー


#### `frontend/src/features/repositories/api`
- API契約（Port）とHTTP実装（Adapter）を配置する。
- HTTPエラーの正規化はここで完結させる。

#### `frontend/src/features/repositories/model`
- zod schema と型定義の単一ソースを置く。
- 型は schema から導出し、重複定義を避ける。

#### `frontend/src/features/repositories/hooks`
- React Query の query/mutation hook を配置する。
- UI描画ロジックは持たず、データ取得・キャッシュ無効化に集中する。

#### `frontend/src/features/repositories/ui`
- `RepositoriesPage`: 画面の組み立て（composition）のみ担当。
- `components/*`: 表示/入力の責務を小さく分割して担当。

### Frontend 実装ルール
- `new HttpRepositoryApiAdapter(...)` を `ui` で直接生成しない。`app` 層のProvider経由で注入する。
- APIレスポンスの parse とエラー判定は adapter で完了させ、UIは成功/失敗状態を表示するだけにする。
- 機能追加時は `Page` に直接ロジックを足さず、まず `hooks` と `components` の責務分割を維持する。

# Task 7 の実行指示
1. **調査 & 設計確認**:
   - Context（/Users/ryo/Repositories/codex/oss-health-checker/openspec/changes/oss-maintenance-visibility-mvp/tasks.md）からTask 7の詳細を読み取ってください。
   - 実装前に、この設計思想に照らして不明点や、設計上のトレードオフがあれば必ず質問し、私の合意を得てください。
2. **ブランチ作成**:
   - `feature/task-7-[task-description]` という形式でブランチ作成の提案
3. **実装 (Frontend focus)**:
   - **Modern React**: `Suspense`, `Error Boundary` を活用したローディング/エラー設計。
   - **Tailwind CSS**: シャープで洗練されたデザイン。
   - **UX Psychology**: ユーザーの認知負荷を下げ、直感的な操作を促すデザイン（フィッツの法則、ヒックの法則、メンタルモデルの活用）。skillsのux-psycholosyを利用してください。
   - **No Hacks**: 将来の技術負債になるようなトリッキーな実装を禁止します。
4. **DI & 型の整合性**:
   - バックエンドの OpenAPI スキーマから生成された型をフロントの `model` で再利用し、`adapter` で `port` を実装する流れを徹底してください。
```
