## MODIFIED Requirements

### Requirement: User can register GitHub repositories by URL
The system SHALL allow a user to register a GitHub repository using a valid GitHub repository URL, while preventing duplicate repository records.

#### Scenario: Register a valid repository URL
- **WHEN** a user submits a syntactically valid GitHub repository URL that is not yet stored
- **THEN** the system stores the repository record with owner and repository name derived from the URL

#### Scenario: Reject non-GitHub URL
- **WHEN** a user submits a URL that is not a GitHub repository URL
- **THEN** the system MUST reject the request with a validation error

#### Scenario: Register already seeded repository
- **WHEN** a user submits a valid URL for a repository already present from seed data
- **THEN** the system does not create a duplicate repository record

### Requirement: Repository count is limited to three in MVP
The system MUST enforce a maximum of 3 user-registered repositories per instance in MVP mode, excluding system-seeded repositories.

#### Scenario: Register within user limit
- **WHEN** fewer than 3 user-registered repositories currently exist and user submits a valid URL
- **THEN** the system accepts the registration

#### Scenario: Register over user limit
- **WHEN** 3 user-registered repositories already exist and user submits another valid URL
- **THEN** the system MUST reject the registration with a clear limit error

## ADDED Requirements

### Requirement: Seeder-provisioned repositories SHALL coexist with manual registration
The system SHALL keep seeded repositories and manually registered repositories interoperable in the same repository catalog.

#### Scenario: List includes seeded and manual repositories
- **WHEN** repository data is queried after seed and manual registration
- **THEN** both seeded and manually registered repositories are available without functional regression
