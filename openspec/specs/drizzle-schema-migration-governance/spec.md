## ADDED Requirements

### Requirement: Schema and migration source of truth is unified under Drizzle workflow
The system MUST operate schema evolution from Drizzle schema and generated migrations as the single authoritative workflow.

#### Scenario: Schema change requires migration artifact update
- **WHEN** schema definition changes
- **THEN** corresponding migration artifacts MUST be generated and versioned in the same change set

### Requirement: CI detects schema-migration drift
The system MUST enforce CI checks that fail when generated migration state and committed migration artifacts diverge.

#### Scenario: Drift is detected in pull request
- **WHEN** committed schema and migration artifacts are out of sync
- **THEN** CI MUST fail with actionable drift detection output

#### Scenario: Drift output includes remediation hint
- **WHEN** CI detects schema-migration drift
- **THEN** failure output MUST include at least one concrete regeneration command for developers to resolve drift

### Requirement: Migration execution path is deterministic and singular
The system MUST provide one supported migration execution path for local and CI environments.

#### Scenario: Local and CI use same migration command family
- **WHEN** migration is executed in local development and in CI
- **THEN** both environments MUST use the same command family and MUST produce equivalent schema state
