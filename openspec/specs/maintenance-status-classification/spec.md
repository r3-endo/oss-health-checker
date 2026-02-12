## ADDED Requirements

### Requirement: Evaluate warning conditions using fixed thresholds
The system MUST evaluate warning conditions with fixed MVP thresholds.

#### Scenario: Commit staleness warning
- **WHEN** last commit is 6 months or more before evaluation time
- **THEN** the system marks the commit warning condition as true

#### Scenario: Release staleness warning
- **WHEN** last release is 12 months or more before evaluation time
- **THEN** the system marks the release warning condition as true

#### Scenario: Open issues warning
- **WHEN** open issues count is greater than 100
- **THEN** the system marks the issue warning condition as true

### Requirement: Map warning count to three-level status
The system SHALL derive final status from the number of active warning conditions.

#### Scenario: Active status
- **WHEN** no warning conditions are true
- **THEN** the system returns status `Active`

#### Scenario: Stale status
- **WHEN** exactly one warning condition is true
- **THEN** the system returns status `Stale`

#### Scenario: Risky status
- **WHEN** two or more warning conditions are true
- **THEN** the system returns status `Risky`

### Requirement: Classification includes explainable reasons
The system MUST provide which warning conditions triggered the status.

#### Scenario: Return triggered conditions
- **WHEN** status evaluation completes
- **THEN** the response includes the list of triggered warnings used for classification
