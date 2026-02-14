## Why

The repository is currently backend-centric, which makes it hard to evolve into a self-hosted multi-service release model with clear ownership for `frontend`, `backend`, `batch`, `db`, and `infra`. We need to separate codebase layout first so containerization can be implemented in a smaller, safer follow-up change.

## What Changes

- Introduce a monorepo-style directory layout that separates runnable apps (`apps/frontend`, `apps/backend`, `apps/batch`) from shared modules and operational assets.
- Move backend-owned shared code into reusable package boundaries (for example `packages/common` and adapter/core modules) while preserving current API behavior.
- Isolate database assets under `db/` (migrations, drizzle artifacts, seeds) as non-application resources.
- Isolate deployment/runtime assets under `infra/` without introducing Docker implementation in this change.
- Define import/path boundary rules so apps depend on shared packages through module imports rather than deep relative paths.
- Explicitly defer Dockerfile and `compose.yml` work to a subsequent change to reduce rollout risk and review size.

## Capabilities

### New Capabilities
- `application-runtime-layout`: Define required repository structure and dependency boundaries for `frontend`, `backend`, `batch`, shared packages, database assets, and infrastructure assets in preparation for self-hosted deployment.

### Modified Capabilities
- None.

## Impact

- Affected code: repository layout, TypeScript/Bun workspace configuration, import paths, app entrypoint locations, and script locations.
- APIs: no intended external API contract changes in this change.
- Dependencies: may require workspace/path alias updates, but no mandatory new runtime product dependency.
- Systems: CI and local developer commands need path updates to match the new layout.
- Follow-up change: Dockerization (`Dockerfile`, `compose.yml`, service wiring) will be handled as a dedicated separate OpenSpec change.
