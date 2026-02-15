## Why

`apps/backend` ではエントリポイントが `src/` 配下に集約されている一方、feature 実装のみが `apps/backend/features` 直下にあり、backend パッケージ内のソースルートが分断されている。feature 実装も `src/` 配下へ統一し、レイアウト規約を単純化して保守性と探索性を高める。

## What Changes

- backend feature 所有境界を `apps/backend/features/*` から `apps/backend/src/features/*` に変更する
- backend の import alias / tsconfig / 実装 import を新パスに合わせて更新する
- contract test と architecture ドキュメントの規約表記を新パスへ更新する
- 既存 API 契約と backend/batch/common の依存境界ルールは維持する

## Capabilities

### New Capabilities
- なし

### Modified Capabilities
- `application-runtime-layout`: backend feature ownership の正規パスを `apps/backend/src/features/*` へ変更する

## Impact

- Affected code:
  - `apps/backend/features/**` → `apps/backend/src/features/**` への再配置
  - `apps/backend/src/build-app.ts`, `apps/backend/src/build-container.ts`, `apps/backend/tsconfig.json`
  - `backend/tests/contracts/feature-ownership-boundary.test.ts`
  - `docs/architecture.md`
- API: 変更なし（HTTP contract 不変）
- Dependencies/Systems: TypeScript path 解決と契約テストのパス検証条件のみ更新
