# Features Directory Guide

`src/features` contains user-facing capabilities as independent units.

## Per-feature structure

Each feature should keep the following boundaries:

- `api/`: port interfaces and adapter implementations
- `model/`: zod schema + derived TypeScript types
- `hooks/`: TanStack Query and feature orchestration hooks
- `ui/`: pages and presentational components
- `testing/`: feature-local fixtures/builders used by tests

## Placement rules

- Keep business behavior and contracts inside the feature first.
- Move code to `src/shared` only when two or more features reuse it.
- Do not import concrete adapters directly from UI components/pages.
