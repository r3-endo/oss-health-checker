## ADDED Requirements

### Requirement: System SHALL manage category master data
The system SHALL provide a category master with stable slugs and display metadata for category-based monitoring.

#### Scenario: Default categories are available
- **WHEN** the system initializes seed data
- **THEN** categories `llm`, `backend`, and `frontend` exist with unique slugs

#### Scenario: Category metadata is returned
- **WHEN** a client requests category list data
- **THEN** each category includes slug, display name, and display order

### Requirement: Repositories MUST be associated with categories
The system MUST store repository-category associations as a separate relation that supports one repository belonging to multiple categories.

#### Scenario: Seeded repository is linked to category
- **WHEN** default repositories are seeded
- **THEN** each repository has at least one association in repository-category relation

#### Scenario: Duplicate association is rejected
- **WHEN** the same repository-category pair is inserted again
- **THEN** the system keeps exactly one relation record

### Requirement: Category APIs SHALL expose summary and detail views
The system SHALL provide category summary and category detail APIs.

#### Scenario: Get category summaries
- **WHEN** a client calls `GET /api/categories`
- **THEN** the API returns category summary objects for all active categories

#### Scenario: Get category detail
- **WHEN** a client calls `GET /api/categories/:slug` with an existing slug
- **THEN** the API returns category metadata and repositories belonging to that category

#### Scenario: Unknown category slug
- **WHEN** a client calls `GET /api/categories/:slug` with a non-existing slug
- **THEN** the API returns a category-not-found error response

### Requirement: Category detail MUST be sorted by health score
The system MUST sort repositories in category detail by health score in descending order.

#### Scenario: Sorted category repositories
- **WHEN** category detail contains multiple repositories
- **THEN** repositories are ordered from highest to lowest health score

### Requirement: Category detail MUST return nullable trend fields when baseline is missing
The system MUST return `null` for 30-day trend fields when a valid baseline snapshot is unavailable.

#### Scenario: Missing 30-day baseline
- **WHEN** no baseline snapshot exists at or before 30 days prior
- **THEN** `issueGrowth30d` is returned as `null`
