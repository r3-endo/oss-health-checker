## ADDED Requirements

### Requirement: Fetch maintenance signals from GitHub REST API v3
The system SHALL fetch maintenance signals for each registered repository from GitHub REST API v3.

#### Scenario: Signals are fetched successfully
- **WHEN** a fetch is executed for a registered repository
- **THEN** the system retrieves last commit date, last release date (nullable), open issues count, and contributors count

### Requirement: Persist fetched signals in snapshot storage
The system MUST persist fetched repository signals as snapshot data associated with the target repository.

#### Scenario: Snapshot is stored after successful fetch
- **WHEN** the GitHub API responses are successfully processed
- **THEN** the system stores a snapshot containing fetched values and fetch timestamp

### Requirement: Missing release is represented explicitly
The system MUST represent repositories with no release as a null release date.

#### Scenario: Repository without release
- **WHEN** GitHub API indicates no release exists for the repository
- **THEN** the system stores `last_release_at` as null instead of failing the fetch

### Requirement: Manual refresh endpoint updates snapshot
The system SHALL provide an operation to refresh a repository and update its latest snapshot.

#### Scenario: Refresh repository data
- **WHEN** a refresh request is sent for a registered repository
- **THEN** the system refetches GitHub signals and stores a new snapshot for that repository

### Requirement: Repository list API returns latest snapshot per repository
The system MUST provide a list API that returns each registered repository with its latest snapshot fields and latest evaluated status.

#### Scenario: Get repository list with latest snapshot
- **WHEN** a client requests repository list data
- **THEN** the system returns each repository together with last commit date, last release date, open issues count, contributors count, status, and fetched timestamp from the latest snapshot

### Requirement: Fetch failure preserves previous snapshot
The system MUST preserve the previous successful snapshot when GitHub fetch fails.

#### Scenario: Refresh fails due to GitHub API error
- **WHEN** a refresh request fails because GitHub API returns an error or rate limit response
- **THEN** the system does not overwrite the previous successful snapshot and returns a refresh failure result
