## ADDED Requirements

### Requirement: Repository routes are bound to OpenAPI request and response schemas
The system MUST bind `/repositories` route handlers to OpenAPI request/response/error schemas at route definition time.

#### Scenario: All repository endpoints are OpenAPI-bound
- **WHEN** repository routes are enumerated
- **THEN** `POST /repositories`, `GET /repositories`, and `POST /repositories/:id/refresh` MUST each have OpenAPI-bound route definitions

#### Scenario: Register route validates request body via OpenAPI schema
- **WHEN** client sends an invalid register request payload
- **THEN** the request MUST fail under OpenAPI-bound validation contract with HTTP 400 validation error response

#### Scenario: Refresh route declares error responses in contract
- **WHEN** refresh route is registered
- **THEN** the route contract MUST include mapped error responses for at least validation, rate-limit, and external API failure cases

### Requirement: Controller-level duplicated request validation is removed
The system MUST avoid duplicate request-shape validation in controllers when the same contract is defined at route layer.

#### Scenario: Route-level schema is single validation source
- **WHEN** repository endpoint input schema changes
- **THEN** input validation behavior MUST be updated through route schema definition without requiring duplicated controller schema updates

### Requirement: OpenAPI document reflects active runtime endpoints
The system MUST generate OpenAPI documentation from the same route definitions used at runtime.

#### Scenario: Runtime endpoint is missing from OpenAPI document
- **WHEN** an endpoint exists in runtime router but is not OpenAPI-bound
- **THEN** contract verification MUST fail in CI
