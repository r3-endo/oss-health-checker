## ADDED Requirements

### Requirement: Adapter mapping validates DB enum-like fields at runtime
The system MUST validate persisted enum-like values (such as repository status and warning reasons) before mapping to domain models.

#### Scenario: Valid persisted status maps successfully
- **WHEN** adapter reads a snapshot row with a known allowed status value
- **THEN** adapter MUST map the value to domain status without unsafe cast

#### Scenario: Unknown persisted status is rejected
- **WHEN** adapter reads a snapshot row with an unknown status value
- **THEN** adapter MUST fail fast with an internal application error and MUST NOT emit domain model with coerced value

### Requirement: Adapter mapping validates warning reason collection
The system MUST validate each warning reason key read from persistence before building domain models.

#### Scenario: Unknown warning reason key is rejected
- **WHEN** adapter reads warning reason values containing at least one unknown key
- **THEN** adapter MUST fail mapping and MUST report invalid persisted value context

### Requirement: Unsafe type assertions are not used for DB-to-domain mapping
The system MUST avoid `as`-based trust casts for persisted discriminated values in repository and snapshot adapters.

#### Scenario: Mapper implementation is assertion-free for discriminated fields
- **WHEN** adapter mapping code for status and warning reasons is reviewed
- **THEN** mapping of those fields MUST use runtime checks or schema parsing instead of unsafe type assertions
