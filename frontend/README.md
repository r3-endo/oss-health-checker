# Frontend

Architecture:

- Feature-based folder structure
- `app` = composition root / provider wiring
- `features` = feature-local API/model/hooks/ui
- `shared` = cross-feature reusable primitives only
- State management: jotai
- Server-state fetching: TanStack Query
- Validation: zod
- API boundary via repository API port + adapter

Directory guide:

```text
src/
  app/
  features/
    <feature>/
      api/
      model/
      hooks/
      ui/
      testing/        # feature-local fixtures/builders
  shared/
    ui/               # cross-feature presentational primitives
    lib/              # pure utility helpers
    types/            # cross-feature shared types
tests/
  app/
  features/<feature>/
    api/
    hooks/
    ui/
    testing/          # test-only builders/fixtures
```

Notes:

- Keep domain-specific code inside each feature. Promote to `shared/` only after at least two features need the same abstraction.
- For Phase 2 adoption columns, add table cell components and UI tests under `features/repositories/ui/components/adoption/` and `tests/features/repositories/ui/adoption/`.

Commands:

- `bun run format:check`
- `bun run lint`
- `bun run test`
