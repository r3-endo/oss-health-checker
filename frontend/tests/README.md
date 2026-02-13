# Frontend Test Layout

`frontend/tests` is organized by architecture boundaries to reduce breakage as features grow.

- `app/`
  - Tests for composition root and app-level providers/factories.
- `features/<feature>/api/`
  - Contract and adapter tests for external/API boundaries.
- `features/<feature>/hooks/`
  - Query/mutation and state orchestration tests.
- `features/<feature>/ui/`
  - Presentational and page-composition tests.
- `features/<feature>/testing/`
  - Feature-local test fixtures/builders shared across API/hooks/UI tests.
- `shared/placeholders/`
  - Temporary placeholders; replace with real tests when implementing new tasks.

Guideline:
- Add tests next to the boundary they validate, not by file type only.
- Keep test names scoped by behavior, and mirror feature names from `src/features`.
