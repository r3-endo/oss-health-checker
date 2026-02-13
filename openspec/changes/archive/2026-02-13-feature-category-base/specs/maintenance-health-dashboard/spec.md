## MODIFIED Requirements

### Requirement: Dashboard is a single-page interface
The system SHALL provide a one-page dashboard containing category tabs in the upper section and a repository status table in the lower section.

#### Scenario: Dashboard layout
- **WHEN** a user opens the application
- **THEN** the page shows category tabs and a repository table for the selected category

### Requirement: Table displays required maintenance fields
The system MUST display required maintenance fields for each repository in the selected category.

#### Scenario: Display repository row
- **WHEN** category repository data is available
- **THEN** each row shows repository name, health score, status, last commit date, issue growth over 30 days, and commit count over 30 days

## ADDED Requirements

### Requirement: User can switch categories from dashboard tabs
The system SHALL allow the user to switch the displayed repository table by selecting a category tab.

#### Scenario: Switch to another category
- **WHEN** user selects a different category tab
- **THEN** the dashboard requests and renders repository data for the selected category

### Requirement: Dashboard SHALL show loading and error states for category fetch
The system SHALL render explicit loading and error states when category detail data is being fetched or fails to load.

#### Scenario: Loading category detail
- **WHEN** category detail request is in progress
- **THEN** the dashboard shows a loading state in the repository table area

#### Scenario: Category detail fetch failure
- **WHEN** category detail request fails
- **THEN** the dashboard shows an error state without crashing the page
