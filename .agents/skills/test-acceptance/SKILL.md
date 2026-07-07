---
name: test-acceptance
description: >
  Acceptance/E2E testing patterns for Hexagonal Architecture Apps layer (Cucumber.js + Supertest).
  Trigger: When writing or reviewing acceptance tests, Cucumber feature files, or step definitions for the API endpoints.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: "2.0"
  scope: [root, backend]
  auto_invoke:
    - "Writing acceptance tests with Cucumber.js"
    - "Testing Apps layer controllers"
    - "Writing API E2E tests"
---

## Activation Contract

Use this skill EXCLUSIVELY when writing **Acceptance (E2E)** tests using Cucumber.js and Supertest.
These tests validate the application from the outside in (HTTP request -> Controller -> Use Case -> Database -> HTTP Response). Do NOT use this skill for Unit or Integration tests.

## Hard Rules (NEVER Break)

- **Black Box Testing**: PROHIBITED to mock internal application logic. The API must be tested as a complete black box using `supertest`.
- **Gherkin First**: You MUST write the `.feature` file first using `Given/When/Then` vocabulary before implementing the step definitions.
- **Seed State in Before Hooks**: To prepare necessary data (Arrange), use database seeds directly in the `Before` hook of the step definitions, rather than exposing non-business endpoints. Do NOT interact with the DB inside the `Given` steps.
- **Real JWT Authentication**: Requests that require authentication MUST include a real, valid JWT token signed against the test Keycloak instance. Do NOT mock the auth middleware.
- **OpenAPI Compliance**: Your assertions MUST verify the correct HTTP status codes (201, 400, 404) as defined in `definition.json`.

## Execution Steps

1. Create or update the `.feature` file in `test/acceptance/features/` defining the scenarios.
2. In the step definitions (`.steps.ts`), use a `Before` hook to clean the database and insert any required seed data via direct database access.
3. In the `Given` steps, set up the request payload and headers (including the real Keycloak JWT).
4. In the `When` steps, use `supertest` to execute the HTTP call to the Express application.
5. In the `Then` steps, assert the response status and body.

## Decision Gates

| Situation | Action |
| --- | --- |
| The test requires existing users/data | Insert the data directly into the test database inside a `Before` hook (seeding). |
| The endpoint is protected by Auth | Generate a real JWT from the test Keycloak server and pass it in the `Authorization` header. |
| The HTTP response contains errors | Validate that the status code and payload structure exactly match `definition.json`. |

## Output Contract

Provide the `.feature` file and its corresponding `.steps.ts` code, guaranteeing that the interaction acts purely as an HTTP client.
