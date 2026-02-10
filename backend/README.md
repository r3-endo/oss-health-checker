# Backend

Architecture:

- Layered: controller, service, repository, infrastructure
- Ports/Adapters for swappable infrastructure (DB, external APIs)
- OpenAPI schemas managed via zod-openapi
- ORM: drizzle (schema-first)

Commands:

- `bun run format:check`
- `bun run lint`
- `bun run test`
