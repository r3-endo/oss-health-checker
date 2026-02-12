## ADDED Requirements

### Requirement: User can register GitHub repositories by URL
The system SHALL allow a user to register a GitHub repository using a valid GitHub repository URL.

#### Scenario: Register a valid repository URL
- **WHEN** a user submits a syntactically valid GitHub repository URL
- **THEN** the system stores the repository record with owner and repository name derived from the URL

#### Scenario: Reject non-GitHub URL
- **WHEN** a user submits a URL that is not a GitHub repository URL
- **THEN** the system MUST reject the request with a validation error

### Requirement: Repository count is limited to three in MVP
The system MUST enforce a maximum of 3 registered repositories per instance in MVP mode.

#### Scenario: Register within limit
- **WHEN** fewer than 3 repositories are currently registered and user submits a valid URL
- **THEN** the system accepts the registration

#### Scenario: Register over limit
- **WHEN** 3 repositories are already registered and user submits another valid URL
- **THEN** the system MUST reject the registration with a clear limit error

### Requirement: Initial fetch is triggered on registration
The system SHALL trigger data fetch and status evaluation immediately after successful registration.

#### Scenario: Initial snapshot created
- **WHEN** repository registration succeeds
- **THEN** the system creates an initial snapshot for that repository and persists the evaluated status
