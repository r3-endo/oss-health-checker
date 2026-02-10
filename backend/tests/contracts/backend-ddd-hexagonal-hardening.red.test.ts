import { describe, it } from "vitest";

describe("backend-ddd-hexagonal-hardening red cases by capability", () => {
  it.todo(
    "[RED][application-error-contract] refresh failure returns ApplicationError-based HTTP status (429/502/404/500), never 200 error payload",
  );
  it.todo(
    "[RED][transactional-use-case-boundary] register repository and snapshot are rolled back atomically on snapshot write failure",
  );
  it.todo(
    "[RED][openapi-runtime-contract-binding] repository endpoints fail contract verification when request/response/error schema is not route-bound",
  );
  it.todo(
    "[RED][adapter-runtime-type-safety] unknown persisted status/warning reason fails fast with INTERNAL_ERROR mapping",
  );
  it.todo(
    "[RED][drizzle-schema-migration-governance] schema and migration drift check fails with regeneration guidance",
  );
});
