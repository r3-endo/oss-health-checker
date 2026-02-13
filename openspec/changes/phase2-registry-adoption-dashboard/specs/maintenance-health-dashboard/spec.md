## MODIFIED Requirements

### Requirement: GitHub Health page displays required maintenance fields
The system MUST display required maintenance fields for each repository in the GitHub Health page table.

#### Scenario: Display repository row in GitHub Health
- **WHEN** GitHub Health list data is available
- **THEN** each row shows repository name, status, last commit date, last release date, and open issues count

## ADDED Requirements

### Requirement: Dashboard provides navigation to GitHub and Registry pages
The system SHALL provide a dashboard hub page that links users to GitHub Health and Registry Adoption pages.

#### Scenario: Navigate from dashboard hub
- **WHEN** the user opens the dashboard
- **THEN** the UI SHALL show links/actions to both GitHub Health and Registry Adoption pages

### Requirement: Dashboard integration boundary is isolated from feature internals
The system MUST fetch integrated dashboard rows from a dedicated dashboard overview API contract so changes in adoption internals do not require modifying development-health feature contracts.

#### Scenario: Dashboard reads from dedicated overview endpoint
- **WHEN** the dashboard UI loads repository rows
- **THEN** it SHALL consume a dedicated overview endpoint that already composes development-health and adoption fields
