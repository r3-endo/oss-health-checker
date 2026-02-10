## ADDED Requirements

### Requirement: Backend Logic QA MCP Interface
The system MUST provide MCP tools for backend logic QA using separated responsibilities: one tool for evidence discovery and one tool for answer generation.

#### Scenario: Tools are exposed with distinct roles
- **WHEN** a client lists available MCP tools for this capability
- **THEN** the system SHALL expose `find_logic_evidence` and `ask_logic_qa` as separate tools

### Requirement: Evidence Discovery Contract
The `find_logic_evidence` tool MUST accept a logic question and return structured evidence with source metadata and searchable scope details.

#### Scenario: Evidence discovery returns normalized records
- **WHEN** a client calls `find_logic_evidence` with a valid backend question
- **THEN** the system SHALL return `evidence[]` entries containing `kind`, `path`, `line`, `excerpt`, and relevance metadata

#### Scenario: Scope is explicit in response
- **WHEN** `find_logic_evidence` completes a search
- **THEN** the system SHALL return `search_scope[]` showing which paths were used for resolution

### Requirement: Structured Answer Contract
The `ask_logic_qa` tool MUST return a machine-readable response containing answer text, supporting evidence, confidence, mismatch flag, unknowns, and status.

#### Scenario: Successful answer includes required fields
- **WHEN** `ask_logic_qa` is called with sufficient evidence
- **THEN** the system SHALL return `answer`, `evidence[]`, `confidence`, `spec_mismatch`, `unknowns[]`, and `status="ok"`

#### Scenario: Insufficient evidence is explicit
- **WHEN** `ask_logic_qa` is called with no evidence
- **THEN** the system SHALL return `status="insufficient_evidence"` and `confidence=0.0`

### Requirement: Spec Mismatch Signaling
The system MUST continue returning an answer even when code and spec conflict, and it MUST explicitly signal mismatch.

#### Scenario: Code-spec conflict is reported without aborting
- **WHEN** high-relevance code evidence conflicts with corresponding normative spec statements
- **THEN** the system SHALL set `spec_mismatch=true` and include a mismatch marker in `unknowns[]`

### Requirement: Out-of-Scope Handling
The system MUST classify non-supported questions and return a deterministic out-of-scope response.

#### Scenario: Runtime data question is out of scope
- **WHEN** a question requires live runtime data such as current DB values or latest external API values
- **THEN** the system SHALL return `status="out_of_scope"` with a reason in `answer`

### Requirement: Source Priority and Search Boundaries
For this MVP, the system MUST prioritize code over change specs over main specs when ranking evidence.

#### Scenario: Ranking follows source priority
- **WHEN** evidence candidates are found from code and spec sources
- **THEN** the system SHALL rank candidates using source priority `code > change specs > main specs`
