## ADDED Requirements

### Requirement: UnitOfWorkPort defines use-case transaction boundary
The system MUST provide `UnitOfWorkPort` in application ports to execute use-case work within a single transaction boundary.

#### Scenario: Use case work executes inside transaction callback
- **WHEN** application service invokes `runInTransaction`
- **THEN** all writes performed through transaction-scoped ports MUST execute within one DB transaction

#### Scenario: UnitOfWorkPort supports async work
- **WHEN** transaction callback performs asynchronous operations
- **THEN** `runInTransaction` MUST preserve atomic commit/rollback behavior across awaited operations

### Requirement: Repository register operation is atomic
The system MUST execute repository creation and initial snapshot creation atomically in register use case.

#### Scenario: Register commits both repository and snapshot on success
- **WHEN** register use case succeeds end-to-end
- **THEN** the system MUST persist both repository record and initial snapshot in the same committed transaction

#### Scenario: Register rolls back repository when snapshot write fails
- **WHEN** snapshot persistence fails after repository persistence is attempted
- **THEN** the transaction MUST roll back and MUST leave no newly-created repository record

### Requirement: Transaction implementation is infrastructure-contained
The system MUST keep concrete transaction implementation details in infrastructure adapters.

#### Scenario: Application layer depends only on UnitOfWorkPort abstraction
- **WHEN** application use case code is inspected
- **THEN** it MUST NOT import drizzle transaction types or infrastructure modules directly
