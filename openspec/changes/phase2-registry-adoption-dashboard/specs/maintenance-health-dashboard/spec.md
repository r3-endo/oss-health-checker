## MODIFIED Requirements

### Requirement: Table displays required maintenance fields
The system MUST display required maintenance and adoption fields for each repository in the dashboard table.

#### Scenario: Display repository row with adoption columns
- **WHEN** repository list data is available
- **THEN** each row shows repository name, status, last commit date, last release date, open issues count, package name, weekly downloads, downloads delta 7d, downloads delta 30d, last published date, and latest version

## ADDED Requirements

### Requirement: Dashboard displays not-mapped state for adoption layer
The system SHALL display `Not Mapped` for adoption fields when a repository has no package mapping.

#### Scenario: Render not-mapped adoption values
- **WHEN** a repository row has `mappingStatus="not_mapped"`
- **THEN** the dashboard SHALL display `Not Mapped` for package-related adoption columns

### Requirement: Dashboard preserves adoption values on refresh failure
The system SHALL keep previously displayed adoption values and show failure feedback when adoption refresh fails.

#### Scenario: Adoption refresh failure feedback
- **WHEN** adoption refresh fails for a repository with a previous successful adoption snapshot
- **THEN** the dashboard SHALL keep the previous adoption values visible and indicate that the latest adoption update failed
