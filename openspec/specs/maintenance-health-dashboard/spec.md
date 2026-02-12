## ADDED Requirements

### Requirement: Dashboard is a single-page interface
The system SHALL provide a one-page dashboard containing repository URL input and repository status table.

#### Scenario: Dashboard layout
- **WHEN** a user opens the application
- **THEN** the page shows a repository URL input form in the upper section and a repository table in the lower section

### Requirement: Table displays required maintenance fields
The system MUST display required maintenance fields for each repository in the dashboard table.

#### Scenario: Display repository row
- **WHEN** repository data is available
- **THEN** each row shows repository name, status, last commit date, last release date, and open issues count

### Requirement: Status is shown as three-level indicator
The system SHALL render `Active`, `Stale`, and `Risky` as the only status values in the dashboard.

#### Scenario: Render status value
- **WHEN** a repository has an evaluated status
- **THEN** the table displays one of `Active`, `Stale`, or `Risky`

### Requirement: Dashboard displays classification reasons
The system MUST display which warning conditions triggered the current status for each repository.

#### Scenario: Render triggered warning reasons
- **WHEN** repository status data includes triggered warning conditions
- **THEN** the dashboard shows the triggered conditions alongside the status for that repository

### Requirement: User can refresh repository status from UI
The system SHALL provide a refresh action in the dashboard to trigger latest signal fetch and reclassification.

#### Scenario: Refresh from dashboard
- **WHEN** user triggers refresh for a repository from the dashboard
- **THEN** the UI updates to show the latest snapshot values and status after refresh completes

### Requirement: Dashboard handles refresh failure without hiding previous data
The system SHALL keep showing the previous snapshot and display refresh failure feedback when refresh fails.

#### Scenario: Refresh failure feedback
- **WHEN** repository refresh fails due to GitHub API error or rate limit
- **THEN** the dashboard keeps the previously displayed snapshot and shows that update failed
