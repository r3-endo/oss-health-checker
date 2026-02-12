## MODIFIED Requirements

### Requirement: Evaluate warning conditions using fixed thresholds
The system MUST evaluate health score deductions using fixed threshold rules for scoreVersion `1`.

#### Scenario: Commit staleness deduction
- **WHEN** last commit is missing or older than 180 days before evaluation time
- **THEN** the system applies a 40-point deduction

#### Scenario: Release staleness deduction
- **WHEN** last release is missing or older than 365 days before evaluation time
- **THEN** the system applies a 20-point deduction

#### Scenario: Open issues deduction
- **WHEN** open issues count is greater than 100
- **THEN** the system applies a 15-point deduction

#### Scenario: Contributor count deduction
- **WHEN** contributors count is less than 3
- **THEN** the system applies a 15-point deduction

### Requirement: Map warning count to three-level status
The system SHALL derive final status from computed health score ranges.

#### Scenario: Active status
- **WHEN** computed health score is 70 or higher
- **THEN** the system returns status `Active`

#### Scenario: Stale status
- **WHEN** computed health score is between 40 and 69 inclusive
- **THEN** the system returns status `Stale`

#### Scenario: Risky status
- **WHEN** computed health score is below 40
- **THEN** the system returns status `Risky`

### Requirement: Classification includes explainable reasons
The system MUST provide the applied deduction reasons used for classification.

#### Scenario: Return deduction reasons
- **WHEN** status evaluation completes
- **THEN** the response includes which deduction rules were applied

## ADDED Requirements

### Requirement: Classification MUST expose health score and score version
The system MUST return both numeric health score and score version with each classification result.

#### Scenario: Return score payload
- **WHEN** a repository is evaluated
- **THEN** the response includes `healthScore` and `scoreVersion`

#### Scenario: Clamp score lower bound
- **WHEN** total deductions exceed 100 points
- **THEN** the returned health score is clamped to `0`
