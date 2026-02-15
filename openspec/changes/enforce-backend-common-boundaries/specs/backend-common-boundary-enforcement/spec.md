## ADDED Requirements

### Requirement: Backend と Common の依存境界は CI で強制される
The system MUST enforce repository dependency boundaries between `apps/backend`, `apps/batch`, and `apps/common` through automated checks that run in CI.

#### Scenario: batch から backend HTTP interface への禁止依存を検出する
- **WHEN** `apps/batch` の import 依存を検査する
- **THEN** `apps/backend/interface` への直接 import が存在した場合は検証が失敗しなければならない

#### Scenario: common から backend 実装への禁止依存を検出する
- **WHEN** `apps/common` の import 依存を検査する
- **THEN** `apps/backend` への直接 import が存在した場合は検証が失敗しなければならない

### Requirement: Backend feature ownership は `apps/backend/features/*` に固定される
The system MUST keep backend-only application/domain/infrastructure implementations under `apps/backend/features/*` and MUST NOT keep backend-only implementations in `apps/common`.

#### Scenario: backend 専用実装が common に残っていない
- **WHEN** feature 実装配置を検査する
- **THEN** backend でのみ利用される use-case/read-model/port/adapter は `apps/common` ではなく `apps/backend/features/*` に配置されていなければならない

#### Scenario: 移動後も batch が必要な契約のみ common に残る
- **WHEN** `apps/common` の feature 関連コードを検査する
- **THEN** batch と backend の双方から利用される契約または最小共有実装のみが残っていなければならない

### Requirement: Common への追加は cross-app 利用証跡を要求する
The system MUST require demonstrable cross-app usage before accepting new runtime code in `apps/common`.

#### Scenario: 単一 app 専用コードの common 追加は拒否される
- **WHEN** 新規コードを `apps/common` に追加し、その利用元が単一 app のみである
- **THEN** 境界検証は失敗し、実装は app 側へ戻す必要がある

#### Scenario: 複数 app 利用コードの common 追加は許可される
- **WHEN** 新規コードが backend と batch の双方から利用される
- **THEN** 境界検証は成功し、`apps/common` 配置が許可されなければならない
