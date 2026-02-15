## ADDED Requirements

### Requirement: Feature implementation ownership is anchored in backend
The system MUST place primary feature implementations under `apps/backend/features/*` and MUST treat backend as the owner of feature behavior changes.

#### Scenario: Feature code is added in backend-owned location
- **WHEN** 開発者が `development-health` などの feature 実装を追加または更新する
- **THEN** その実装は `apps/backend/features/*` 配下に配置されなければならない

### Requirement: Common layer is limited to cross-app reusable elements
The system MUST allow `apps/common` to contain only elements reused by multiple apps and MUST NOT move backend-only implementation into `apps/common`.

#### Scenario: Backend-only logic remains in backend
- **WHEN** 実装が backend でのみ利用されることを確認できる
- **THEN** その実装は `apps/common` へ移動せず `apps/backend/features/*` に維持されなければならない

### Requirement: Batch reuses extracted common contracts without backend direct import
The system MUST let batch consume shared capabilities through `apps/common` contracts and MUST NOT directly import backend interface/presentation modules.

#### Scenario: Batch execution path does not import backend HTTP layer
- **WHEN** `apps/batch` の import 依存を検査する
- **THEN** `apps/backend/interface` または HTTP route/controller 実装への直接 import は存在してはならない
