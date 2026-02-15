## MODIFIED Requirements

### Requirement: Fetch maintenance signals from GitHub REST API v3
The system SHALL fetch maintenance signals for each registered repository from GitHub REST API v3, and the ingestion use-case implementation MUST be owned by backend feature modules while allowing selective extraction to `apps/common` for batch reuse.

#### Scenario: Signals are fetched successfully
- **WHEN** a fetch is executed for a registered repository
- **THEN** the system retrieves last commit date, last release date (nullable), open issues count, and contributors count

#### Scenario: Batch calls extracted ingestion contract without backend direct dependency
- **WHEN** batch runs daily collection flow
- **THEN** it invokes ingestion capability through `apps/common` extracted contracts and does not directly import backend HTTP/interface modules

### Requirement: Manual refresh endpoint updates snapshot
The system SHALL provide an operation to refresh a repository and update its latest snapshot, with backend owning endpoint wiring while shared ingestion logic may be reused by batch.

#### Scenario: Refresh repository data
- **WHEN** a refresh request is sent for a registered repository
- **THEN** the system refetches GitHub signals and stores a new snapshot for that repository
