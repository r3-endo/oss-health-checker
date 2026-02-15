## MODIFIED Requirements

### Requirement: 共有コードは packages 経由で利用される
The system MUST keep backend feature ownership under `apps/backend/src/features/*`, MUST place only cross-app reusable code under `apps/common/*`, and MUST enforce that apps do not directly depend on each other's internal source modules.

#### Scenario: backend が batch の実装へ直接依存しない
- **WHEN** `apps/backend` の import 依存を検査する
- **THEN** `apps/batch` 配下のソースへ直接 import してはならず、共有コードは `apps/common` 経由で参照しなければならない

#### Scenario: batch が backend の実装へ直接依存しない
- **WHEN** `apps/batch` の import 依存を検査する
- **THEN** `apps/backend` 配下のソースへ直接 import してはならず、共有コードは `apps/common` 経由で参照しなければならない

#### Scenario: common が backend 実装へ逆依存しない
- **WHEN** `apps/common` の import 依存を検査する
- **THEN** `apps/backend` 配下のソースへ直接 import してはならない

#### Scenario: 共通化対象は cross-app 利用時のみ抽出される
- **WHEN** 開発者が `apps/common` 配下へ実装を追加する
- **THEN** その実装は複数 app で利用されることが確認されなければならない
