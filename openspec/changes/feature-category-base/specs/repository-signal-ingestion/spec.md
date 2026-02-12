## MODIFIED Requirements

### Requirement: Fetch maintenance signals from GitHub REST API v3
The system SHALL fetch maintenance signals for each registered repository from GitHub REST API v3, including fields required for current and planned Dev Health metrics.

#### Scenario: Signals are fetched successfully
- **WHEN** a fetch is executed for a registered repository
- **THEN** the system retrieves last commit date, last release date (nullable), open issues count, contributors count, and fields needed for 30-day trend and future score extensions

### Requirement: Persist fetched signals in snapshot storage
The system MUST persist fetched repository signals as daily snapshot data associated with the target repository.

#### Scenario: Snapshot is stored after successful fetch
- **WHEN** the GitHub API responses are successfully processed
- **THEN** the system stores a snapshot for the repository and UTC day containing fetched values and derived trend-support fields

### Requirement: Manual refresh endpoint updates snapshot
The system SHALL provide an operation to refresh a repository and update its snapshot for the current UTC day.

#### Scenario: Refresh repository data
- **WHEN** a refresh request is sent for a registered repository
- **THEN** the system refetches GitHub signals and upserts the repository snapshot for the current UTC day

### Requirement: Fetch failure preserves previous snapshot
The system MUST preserve the previous successful snapshot when GitHub fetch fails.

#### Scenario: Refresh fails due to GitHub API error
- **WHEN** a refresh request fails because GitHub API returns an error or rate limit response
- **THEN** the system does not overwrite the previous successful snapshot and returns a refresh failure result

## ADDED Requirements

### Requirement: System SHALL record one snapshot per repository per UTC day
The system SHALL enforce one snapshot record per repository and UTC day across scheduled runs and manual refresh.

#### Scenario: Scheduled job reruns same day
- **WHEN** snapshot collection runs multiple times on the same UTC day
- **THEN** only one snapshot record exists for that repository and day

### Requirement: Snapshot schedule MUST run daily with manual replay support
The system MUST execute daily snapshot collection and support manual rerun.

#### Scenario: Scheduled collection
- **WHEN** daily schedule trigger fires
- **THEN** the system runs snapshot collection for all target repositories

#### Scenario: Manual replay
- **WHEN** an operator triggers manual snapshot workflow
- **THEN** the same collection logic runs without requiring code changes

### Requirement: System MUST provide 30-day issue growth inputs
The system MUST keep snapshot history usable to compute issue growth over 30 days.

#### Scenario: Baseline exists
- **WHEN** a snapshot exists at or before 30 days prior to current snapshot day
- **THEN** the system can compute issue growth as current open issues minus baseline open issues

#### Scenario: Baseline missing
- **WHEN** no snapshot exists at or before 30 days prior
- **THEN** issue growth input is treated as unavailable
