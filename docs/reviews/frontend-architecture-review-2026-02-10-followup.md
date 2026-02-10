# Frontend Architecture Review (Follow-up, 2026-02-10)

対象:
- `frontend/src`

## Findings (ordered by severity)

1. **Medium**: RefreshユースケースのUI責務が未配置
- 現在のUIは登録と一覧表示に分離されているが、`refreshRepository` を呼ぶ責務を持つコンポーネント/Hookが未配置。
- アーキテクチャとしては Port だけ先行しており、機能追加時に `RepositoriesPage` へ再集中するリスクがある。
- 参照: `frontend/src/features/repositories/api/repository-api-port.ts:6`, `frontend/src/features/repositories/api/repository-api-adapter.ts:69`, `frontend/src/features/repositories/ui/RepositoriesPage.tsx:18`, `frontend/src/features/repositories/ui/components/RepositoryRow.tsx:3`

2. **Low**: APIのbase URLが固定文字列で、環境切替責務が曖昧
- `RepositoryApiProvider` の `defaultApi` が `new HttpRepositoryApiAdapter('')` 固定。
- dev/stg/prodでの切替方針がProviderに明文化されていないため、将来ここが暗黙依存になりやすい。
- 参照: `frontend/src/app/repository-api-provider.tsx:8`

3. **Low**: READMEの状態管理方針が実装とズレる
- READMEは「State management: jotai」と記載しているが、実装はReact Query中心で、Jotaiは実質未使用（`state/atoms.ts` は説明コメントのみ）。
- 設計意図を誤読される可能性がある。
- 参照: `frontend/README.md:5`, `frontend/src/features/repositories/state/atoms.ts:1`

## Positive changes verified

- 依存注入位置の改善（UIからProviderへ移動）
  - 参照: `frontend/src/app/repository-api-provider.tsx:10`, `frontend/src/features/repositories/ui/RepositoriesPage.tsx:7`
- ページ責務の分割（Form/List/Row）
  - 参照: `frontend/src/features/repositories/ui/RepositoriesPage.tsx:13`, `frontend/src/features/repositories/ui/components/RepositoryRegisterForm.tsx:3`, `frontend/src/features/repositories/ui/components/RepositoryList.tsx:4`, `frontend/src/features/repositories/ui/components/RepositoryRow.tsx:3`
- Query keyの拡張可能化
  - 参照: `frontend/src/features/repositories/hooks/query-keys.ts:1`
- Adapterのエラー正規化とテスト追加
  - 参照: `frontend/src/features/repositories/api/repository-api-adapter.ts:21`, `frontend/tests/repository-api-adapter.test.ts:15`

## Summary

前回指摘の中心だった「責務分離」と「依存注入」は改善済みで、現時点のMVPとしては良い構成。残課題は refresh責務の配置と環境設定の明文化で、どちらも小さな追加で解消できる。
