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
- `bun run test:openapi-contract`
- `bun run db:drizzle:migrate`
- `bun run check:drizzle-drift`

Schema/Migration workflow (local/CI 共通):

1. `src/infrastructure/db/drizzle/schema.ts` を更新
2. `bun run db:drizzle:generate` で migration artifact を更新
3. `bun run db:drizzle:migrate` で同じ command family で適用確認
4. `bun run check:drizzle-drift` で drift がないことを確認

TDD workflow (failure-first):

1. 先に失敗系テストを作成する（外部依存失敗、境界値、null ケースを含む）
2. `bun run test` で Red を確認する
3. 最小実装で Green にする
4. リファクタ後に `bun run lint` / `bun run test` を再実行する
