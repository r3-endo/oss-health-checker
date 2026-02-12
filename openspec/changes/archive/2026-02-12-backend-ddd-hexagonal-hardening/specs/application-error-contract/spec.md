## ADDED Requirements

### Requirement: Use case failure contract is unified to ApplicationError
The system MUST use `ApplicationError` as the single failure contract for application use cases, including repository refresh.

#### Scenario: Refresh maps gateway rate-limit failure to ApplicationError
- **WHEN** refresh execution encounters a gateway failure with code `RATE_LIMIT`
- **THEN** the use case MUST throw `ApplicationError` with code `RATE_LIMIT` and MUST include retry-related detail when available

#### Scenario: Refresh maps non-rate-limit gateway failure to ApplicationError
- **WHEN** refresh execution encounters a gateway failure other than `RATE_LIMIT`
- **THEN** the use case MUST throw `ApplicationError` with code `EXTERNAL_API_ERROR`

#### Scenario: Refresh maps missing repository to ApplicationError
- **WHEN** refresh execution targets a repository id that does not exist
- **THEN** the use case MUST throw `ApplicationError` with code `NOT_FOUND`

#### Scenario: Refresh does not return failure union payload
- **WHEN** refresh execution fails
- **THEN** the use case MUST NOT return `ok: false` style result payload

### Requirement: HTTP error translation is centralized in error mapper
The system MUST translate `ApplicationError` to HTTP responses only through the HTTP error mapper.

#### Scenario: Controller delegates failure handling to middleware path
- **WHEN** a controller action receives an application failure
- **THEN** the controller MUST rethrow and MUST NOT compose error HTTP payload directly

#### Scenario: Refresh endpoint returns non-200 on failure
- **WHEN** refresh fails with `ApplicationError`
- **THEN** the endpoint MUST return mapped HTTP status (for example 429 or 502) and MUST NOT return HTTP 200 with error payload

#### Scenario: Unknown failure is mapped to internal server error
- **WHEN** non-ApplicationError failure reaches HTTP error mapper
- **THEN** HTTP response MUST be 500 and payload error code MUST be `INTERNAL_ERROR` with a non-empty message

### Requirement: Domain layer does not expose external dependency error vocabulary
The system MUST keep external provider-specific error vocabulary out of the domain layer.

#### Scenario: GitHub-specific error codes are not defined in domain errors
- **WHEN** domain error definitions are inspected
- **THEN** they MUST NOT define provider-specific codes such as GitHub API or rate-limit categories

### Requirement: ApplicationError detail is code-consistent
The system MUST constrain `ApplicationError.detail` shape by error code so incompatible fields cannot be emitted.

#### Scenario: RATE_LIMIT detail allows retry metadata
- **WHEN** `ApplicationError.code` is `RATE_LIMIT`
- **THEN** `detail` MUST allow `retryAfterSeconds` and MUST NOT require unrelated validation fields

#### Scenario: VALIDATION_ERROR detail allows validation metadata
- **WHEN** `ApplicationError.code` is `VALIDATION_ERROR`
- **THEN** `detail` MUST allow validation-specific fields (such as reason or limit) and MUST NOT require rate-limit metadata
