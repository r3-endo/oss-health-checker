# phase2-registry-adoption-dashboard design レビュー（2026-02-13）

対象:
- `openspec/changes/phase2-registry-adoption-dashboard/design.md`
- 参照: `docs/architecture.md`

## Findings

### 1. [Medium] Provider 方針の不整合（将来拡張先の定義がアーキテクチャとずれる）
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/design.md:11`
- 参照箇所: `docs/architecture.md:23`
- 内容: design では将来 provider を `Maven/PyPI/crates.io/Homebrew` としている一方、architecture では `npm, Maven Central, PyPI, Homebrew, Docker` を採用対象としている。将来拡張の前提が文書間で一致していない。
- 影響: 次フェーズの実装優先順位・plugin 設計・テスト観点（provider matrix）がドキュメント依存でぶれる。
- 修正提案: design 側で architecture の provider 方針に合わせるか、architecture 側の更新意図を明示して同時に改訂する。

### 2. [Medium] Adoption 状態モデルが不完全で、UI 実装時に解釈差分が発生する
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/design.md:37`, `openspec/changes/phase2-registry-adoption-dashboard/design.md:38`, `openspec/changes/phase2-registry-adoption-dashboard/design.md:39`
- 参照箇所: `docs/architecture.md:8`, `docs/architecture.md:69`
- 内容: `mappingStatus=not_mapped` と `adoptionFetchStatus=failed` は定義されているが、`mapped` かつ成功時の `adoptionFetchStatus`、`not_mapped` 時の `adoptionFetchStatus` の扱い（`null`/`not_applicable` など）が未定義。状態組み合わせの全列挙がない。
- 影響: adapter/zod/hook/UI で独自解釈が入り、同一レスポンスでも表示が不一致になるリスクが高い。
- 修正提案: OpenAPI/Zod の単一ソースで状態遷移を列挙し、許可される組み合わせを明文化する（例: `mappingStatus` × `adoptionFetchStatus` の truth table）。

### 3. [Low] Composition Root での provider registry 構築責務が明記されていない
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/design.md:30`
- 参照箇所: `docs/architecture.md:7`, `docs/architecture.md:31`, `docs/architecture.md:35`
- 内容: 「use-case は provider 識別子で解決」とあるが、registry の構築箇所が記載されていない。architecture 原則では `new` は `shared/bootstrap` に集約する。
- 影響: use-case 内で具象生成や DI ロジックを持ち込み、依存方向の逆流が起きる余地がある。
- 修正提案: design に「provider 登録/解決は `shared/bootstrap/build-container.ts` で配線し、use-case には `RegistryProviderResolverPort` を注入」と追記する。

### 4. [Low] Migration Plan に bootstrap 配線タスクが欠落
- 指摘箇所: `openspec/changes/phase2-registry-adoption-dashboard/design.md:73`, `openspec/changes/phase2-registry-adoption-dashboard/design.md:74`, `openspec/changes/phase2-registry-adoption-dashboard/design.md:75`
- 参照箇所: `docs/architecture.md:31`, `docs/architecture.md:32`
- 内容: マイグレーション手順に feature 実装追加はあるが、container/app への配線手順が明記されていない。
- 影響: 実装完了後に endpoint 未登録・DI 未接続で動作しない抜け漏れが起きやすい。
- 修正提案: Migration Plan に `build-container.ts` と `build-app.ts` の配線を明示的に追加する。

## Overall
- feature 分離、port/adapter、失敗時スナップショット保持の方針は architecture と概ね整合している。
- 上記4点を補強すると、実装フェーズでの解釈差分と統合漏れをほぼ解消できる。
