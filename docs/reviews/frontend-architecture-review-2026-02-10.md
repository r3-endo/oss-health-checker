# Frontend Architecture Review (2026-02-10)

対象:
- `frontend/src`

方針:
- MVPはシンプルなまま維持
- ただし、将来の機能追加（refresh、行アクション、エラー表示拡張）で最小変更になる責務配置を優先

## Findings (ordered by severity)

1. **High**: ページコンポーネントに責務が集中し、拡張時の変更点が増える
- `RepositoriesPage` が入力状態、送信ハンドリング、query実行、mutation実行、エラーatom更新、表示まで持っている。
- 現状は動くが、refreshや行ごとのUI状態を追加すると1ファイルが肥大化しやすい。
- 参照: `frontend/src/features/repositories/ui/RepositoriesPage.tsx:10`, `frontend/src/features/repositories/ui/RepositoriesPage.tsx:19`, `frontend/src/features/repositories/ui/RepositoriesPage.tsx:35`
- 推奨: `RepositoryRegisterForm` と `RepositoryList`（+ `RepositoryRow`）へ分割し、ページは composition 専用にする。

2. **High**: API adapter インスタンス生成位置がUI層にあり、依存差し替えが難しい
- `new HttpRepositoryApiAdapter('')` がUIファイルのモジュールスコープで生成されるため、環境差分・テスト差し替え・将来の認証ヘッダ注入がUI編集を伴う。
- 参照: `frontend/src/features/repositories/ui/RepositoriesPage.tsx:8`
- 推奨: `app/providers` 側で依存注入し、hookへ `useRepositoryApi()` で渡す。

3. **Medium**: クライアント状態管理が分散（React Query + Jotai）だが利用戦略が未定義
- `lastRefreshErrorAtom` を更新しているが表示はなく、`selectedRepositoryIdAtom` も未使用。状態の責務が曖昧。
- サーバー状態に近いエラー情報をJotaiに持つと、将来Query stateとの二重管理になりやすい。
- 参照: `frontend/src/features/repositories/state/atoms.ts:4`, `frontend/src/features/repositories/state/atoms.ts:6`, `frontend/src/features/repositories/ui/RepositoriesPage.tsx:12`, `frontend/src/features/repositories/ui/RepositoriesPage.tsx:22`
- 推奨: MVPでは「サーバー状態はReact Query、UIローカル状態のみReact useState」に寄せる。Jotaiは本当に共有UI状態が必要になるまで導入を見送る。

4. **Medium**: 契約定義が `types.ts` と `schemas.ts` で重複し、変更耐性が下がる
- status / warning reasons / refresh error code が型とzodで重複定義されている。
- API契約変更時に片側更新漏れが起きやすい。
- 参照: `frontend/src/features/repositories/model/types.ts:1`, `frontend/src/features/repositories/model/types.ts:5`, `frontend/src/features/repositories/model/types.ts:27`, `frontend/src/features/repositories/model/schemas.ts:3`, `frontend/src/features/repositories/model/schemas.ts:25`
- 推奨: zod schemaを単一ソースにし、`z.infer`で型を生成する。

5. **Medium**: API adapter のエラー正規化が不足
- `listRepositories` / `registerRepository` は `response.ok` 判定なしでJSON parse + schema parseしているため、APIエラー時の取り扱いが不定。
- `refreshRepository` だけ成功/失敗分岐があり、ポリシーが統一されていない。
- 参照: `frontend/src/features/repositories/api/repository-api-adapter.ts:14`, `frontend/src/features/repositories/api/repository-api-adapter.ts:21`, `frontend/src/features/repositories/api/repository-api-adapter.ts:36`
- 推奨: adapterでHTTPエラーを一貫して正規化し、hookはUIロジックに集中させる。

6. **Low**: Query key 設計が単一固定で、将来の絞り込み/詳細表示に拡張余地が少ない
- 現在は `['repositories']` のみで問題ないが、将来のフィルタや詳細キャッシュを追加する際に整理が必要。
- 参照: `frontend/src/features/repositories/hooks/use-repositories-query.ts:4`
- 推奨: `repositoriesKeys` ファクトリにして拡張点を先に用意する（MVPでは最小実装で可）。

7. **Low**: テストがプレースホルダで、責務分離の回帰を検知できない
- 表示/状態管理/adapter境界の最小テストが未整備。
- 参照: `frontend/tests/tdd.placeholder.test.ts:1`, `frontend/tests/unit.placeholder.test.ts:1`
- 推奨: 最低限、`useRepositoriesQuery` と adapterエラー正規化、`RepositoriesPage` の表示分岐の3点を先に追加。

## MVP-safe Structure Proposal

1. `app/`（グローバル組み立て）
- `providers.tsx`: QueryClientProvider + API依存注入Provider
- `query-client.ts`: Query default policy

2. `features/repositories/api/`
- `repository-api-port.ts`: 入出力契約
- `repository-api-adapter.ts`: HTTP + schema parse + error normalization

3. `features/repositories/model/`
- schema単一ソース（zod）
- typesは `z.infer` 経由

4. `features/repositories/hooks/`
- server state専用 hooks（query/mutation）
- UI共通状態はここで作らない

5. `features/repositories/ui/`
- `RepositoriesPage`: compositionのみ
- `RepositoryRegisterForm`, `RepositoryList`, `RepositoryRow`: 描画責務分離

## Minimal Refactor Steps (smallest useful set)

1. `RepositoriesPage` から form/table を子コンポーネントへ分割
2. API adapter 生成を `AppProviders` に移動し、hookで参照
3. 未使用atomを削除、refreshエラーはmutation stateで扱う
4. schema -> type生成へ一本化
5. adapterのHTTPエラー正規化を統一

## Summary

現状はMVPとして十分小さく、featureフォルダ分割の方向性も良い。ただし、UI層への責務集中と状態管理の二重化の芽があるため、今の段階で「依存注入位置」「状態の原則」「コンポーネント境界」を最小限整えると、今後のリファクタ時の変更量をかなり抑えられる。
