## MODIFIED Requirements

### Requirement: Transaction implementation is infrastructure-contained
The system MUST keep concrete transaction implementation details in infrastructure adapters, and shared transaction-facing contracts extracted to `apps/common` MUST remain backend-agnostic.

#### Scenario: Application layer depends only on UnitOfWorkPort abstraction
- **WHEN** application use case code is inspected
- **THEN** it MUST NOT import drizzle transaction types or infrastructure modules directly

#### Scenario: Shared transaction contracts do not import backend feature implementations
- **WHEN** `apps/common` の transaction 関連コードを検査する
- **THEN** it MUST NOT import modules from `apps/backend/features/*`

#### Scenario: Batch uses shared transaction contract without backend interface dependency
- **WHEN** batch executes transaction-coupled use-case orchestration
- **THEN** it MUST call contracts exposed from `apps/common` and MUST NOT import backend interface modules directly
