# Refresh API Contract Migration Notes

Change: `backend-ddd-hexagonal-hardening`

## What changed

- Endpoint: `POST /api/repositories/{id}/refresh`
- Failure responses are now mapped by `ApplicationError` via `error-mapper.ts`.
- The endpoint no longer returns `200` with error payload on failure.

## Error contract

- `400` `VALIDATION_ERROR`
- `404` `NOT_FOUND`
- `429` `RATE_LIMIT` (supports `detail.retryAfterSeconds`)
- `502` `EXTERNAL_API_ERROR` (supports `detail.status`)
- `500` `INTERNAL_ERROR`

## Migration impact for clients

- Treat non-2xx as failure path (do not parse refresh failure from `200` body).
- Handle `error.code` as the canonical discriminator.
- For rate limiting, use `error.detail.retryAfterSeconds` when present.

## Verification commands

- `bun run test:openapi-contract`
- `bun run test`
