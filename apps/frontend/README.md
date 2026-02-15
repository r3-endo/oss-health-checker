# Frontend

## Architecture

- Feature-based folder structure
- `app` = composition root / provider wiring
- `features` = feature-local API/model/hooks/ui
- `shared` = cross-feature reusable primitives only
- State management: jotai
- Server-state fetching: TanStack Query
- Validation: zod
- API boundary via repository API port + adapter

## Commands (via root)

```bash
bun run frontend:dev
bun run frontend:typecheck
bun run frontend:lint
bun run frontend:test
```
