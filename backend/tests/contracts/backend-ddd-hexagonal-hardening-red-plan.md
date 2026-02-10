# backend-ddd-hexagonal-hardening Red Test Plan

This plan tracks failure-first (Red) cases for each capability in
`openspec/changes/backend-ddd-hexagonal-hardening`.

## Capabilities and Red Cases

1. `application-error-contract`

- `refresh` failure must be surfaced through `ApplicationError`.
- HTTP contract must map to `429/502/404/500`; `200` error payload is forbidden.

2. `transactional-use-case-boundary`

- `register` flow must rollback repository creation when snapshot persistence fails.

3. `openapi-runtime-contract-binding`

- Runtime repository endpoints must fail contract verification if OpenAPI route binding is missing.

4. `adapter-runtime-type-safety`

- Unknown persisted enum-like values (`status`, `warningReasons`) must fail fast.
- Failure must map to `ApplicationError("INTERNAL_ERROR")`.

5. `drizzle-schema-migration-governance`

- Drift check must fail when schema and migration artifacts diverge.
- Failure output must include regeneration commands.
