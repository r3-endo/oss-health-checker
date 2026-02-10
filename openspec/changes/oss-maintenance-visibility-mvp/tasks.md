## 1. Quality Gates and TDD Setup

- [x] 1.1 Configure CI workflow to run `format --check`, `lint`, and `test` on pull requests and main branch pushes
- [x] 1.2 Add local scripts/commands for format, lint, and test so CI and local execution use the same entrypoints
- [x] 1.3 Add initial failing test placeholders (unit and API integration) to establish Red-Green-Refactor flow

## 2. Project Baseline and Shared Types

- [x] 2.1 Confirm React + Hono + SQLite project structure and add missing runtime dependencies
- [x] 2.2 Add environment configuration for GitHub API access (token optional, base URL, timeout)
- [x] 2.3 Add shared types for repository, snapshot, status, warning reasons, and refresh error payload

## 3. Database and Persistence

- [x] 3.1 Define SQLite schema for `repositories` and `snapshots` tables with required columns
- [x] 3.2 Implement DB initialization/migration script to create tables on startup
- [x] 3.3 Implement repository persistence functions (create/list/count/find by id)
- [x] 3.4 Implement snapshot persistence functions (insert snapshot, fetch latest snapshot per repository)

## 4. GitHub Signal Ingestion

- [x] 4.1 Write failing tests for GitHub URL parsing/validation and signal normalization behavior
- [x] 4.2 Implement GitHub URL parser/validator to extract owner and repository name
- [x] 4.3 Implement GitHub REST client methods to fetch last commit date, last release date, open issues count, and contributors count
- [x] 4.4 Implement initial fetch flow triggered immediately after repository registration
- [x] 4.5 Implement refresh flow that keeps previous successful snapshot when GitHub API returns error/rate limit

## 5. Status Classification Logic

- [x] 5.1 Write failing tests for classification thresholds (`>= 6 months`, `>= 12 months`, `open issues > 100`) before implementation
- [x] 5.2 Add explicit unit test for `last_release_at = null` handling in classification
- [x] 5.3 Implement warning-condition evaluator with thresholds (`>= 6 months` commit stale, `>= 12 months` release stale, `open issues > 100`)
- [x] 5.4 Implement status mapper (`0 warnings = Active`, `1 warning = Stale`, `2+ warnings = Risky`)
- [x] 5.5 Implement reason payload builder that returns triggered warning conditions for UI/API

## 6. Backend API (Hono)

- [ ] 6.1 Write failing integration tests for `POST /repositories`, `GET /repositories`, and `POST /repositories/:id/refresh`
- [ ] 6.2 Implement `POST /repositories` with URL validation, 3-repository limit check, and initial fetch execution
- [ ] 6.3 Implement `GET /repositories` to return each repository with latest snapshot fields, status, reasons, `contributors_count`, and fetched timestamp
- [ ] 6.4 Implement `POST /repositories/:id/refresh` to refetch signals, reclassify status, and return refresh outcome
- [ ] 6.5 Implement consistent error responses for validation errors, GitHub API failures, and not-found cases

## 7. Dashboard UI (React)

- [ ] 7.1 Build one-page layout with repository URL input form at top and repository table below
- [ ] 7.2 Connect registration form to `POST /repositories` and display validation/limit errors
- [ ] 7.3 Build repository table columns (name, status, last commit date, last release date, open issues count, contributors count)
- [ ] 7.4 Display classification reasons per repository alongside status
- [ ] 7.5 Add per-repository refresh action and keep previous snapshot visible when refresh fails

## 8. Failure-Path Verification and Documentation

- [ ] 8.1 Add integration test for refresh failure path to verify previous snapshot is preserved and failure result is returned
- [ ] 8.2 Add UI test for refresh failure feedback while keeping previously displayed snapshot values
- [ ] 8.3 Add README with minimal setup/run instructions, quality-gate commands, and MVP constraints
