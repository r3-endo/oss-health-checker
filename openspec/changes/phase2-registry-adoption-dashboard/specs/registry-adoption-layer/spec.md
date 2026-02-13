## ADDED Requirements

### Requirement: Registry adoption data is provided for mapped repositories
The system SHALL provide npm-based adoption data for each repository that has a package mapping.

#### Scenario: Return adoption data for mapped repository
- **WHEN** a repository is mapped to an npm package and adoption data retrieval succeeds
- **THEN** the system SHALL return `packageName`, `weeklyDownloads`, `downloadsDelta7d`, `downloadsDelta30d`, `lastPublishedAt`, and `latestVersion`

### Requirement: Registry Adoption page displays required adoption fields
The system MUST display registry adoption fields in a dedicated Registry Adoption page.

#### Scenario: Display repository row in Registry Adoption page
- **WHEN** registry adoption list data is available
- **THEN** each row shows repository name, package name, weekly downloads, downloads delta 7d, downloads delta 30d, last published date, and latest version

### Requirement: Adoption mapping status is explicit
The system MUST explicitly represent whether a repository is mapped to a registry package.

#### Scenario: Repository without package mapping
- **WHEN** a repository has no package mapping
- **THEN** the system SHALL return `mappingStatus="not_mapped"` and adoption value fields as `null`

### Requirement: Adoption fetch status combinations are constrained
The system MUST enforce only valid `mappingStatus` and `adoptionFetchStatus` combinations in API responses.

#### Scenario: Valid status combinations are returned
- **WHEN** the system builds an adoption response row
- **THEN** it SHALL return only one of the following combinations: `mapped/succeeded`, `mapped/failed`, or `not_mapped/not_applicable`

### Requirement: Fetch failure preserves previous successful adoption snapshot
The system SHALL preserve the last successful adoption snapshot when registry fetch fails.

#### Scenario: npm fetch fails after previous success
- **WHEN** an adoption refresh fails for a mapped repository that has a previous successful snapshot
- **THEN** the system SHALL keep the previous snapshot values and return `adoptionFetchStatus="failed"`

### Requirement: Registry Adoption page displays not-mapped and failed states
The system SHALL render `Not Mapped` and failed-update feedback in the dedicated Registry Adoption page.

#### Scenario: Render not-mapped state in Registry Adoption page
- **WHEN** a repository row has `mappingStatus="not_mapped"`
- **THEN** the page SHALL display `Not Mapped` for adoption columns

#### Scenario: Render failed-update state in Registry Adoption page
- **WHEN** a repository row has `adoptionFetchStatus="failed"` and previous values
- **THEN** the page SHALL keep previous adoption values visible and indicate that the latest adoption update failed

### Requirement: Adoption layer is provider-extensible via application ports
The system MUST resolve registry providers through application ports so new providers can be added without changing use-case logic.

#### Scenario: Provider resolution is abstracted
- **WHEN** the adoption use-case selects a registry provider
- **THEN** the system SHALL resolve the provider via a resolver port rather than direct concrete provider construction

### Requirement: Adoption integration is consumed via dashboard overview boundary
The system MUST expose adoption-integrated repository rows through a dedicated dashboard overview boundary, not by coupling adoption join logic into development-health internals.

#### Scenario: Dashboard endpoint composes adoption and dev-health
- **WHEN** the dashboard repository list is requested
- **THEN** the system SHALL return an integrated row from a dashboard-overview read model that composes development-health and ecosystem-adoption data
