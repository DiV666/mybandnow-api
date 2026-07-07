---
name: test-integration
description: >
  Integration testing patterns for Hexagonal Architecture Infrastructure layer (MongoDB, RabbitMQ, HTTP Adapters).
  Trigger: When writing integration tests for infrastructure components, external services, databases, or message brokers.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root, backend]
  auto_invoke:
    - 'Writing integration tests against real MongoDB or RabbitMQ'
    - 'Testing Infrastructure layer adapters'
    - 'Testing HTTP external service integrations'
---

## Activation Contract

Use this skill EXCLUSIVELY when testing the **Infrastructure** layer.
Integration tests are designed to verify that our system communicates correctly with external boundaries (Databases, Event Buses, external HTTP APIs). Do NOT use this skill for Use Cases or Domain logic (use `test-unit` instead).

## Hard Rules (NEVER Break)

- **Real Infrastructure**: You MUST NOT mock MongoDB or RabbitMQ. You must connect to real instances (usually running via Docker).
- **Data Cleanup**: You MUST clean the test database collections in a `beforeEach` or `afterEach` block to ensure deterministic, isolated tests.
- **NO Axios Mocks**: PROHIBITED to use `vi.mock('axios')` or any in-process HTTP mocking. External HTTP adapters MUST make real HTTP calls. Acceptable targets are: the provider's official sandbox URL, or a local Dockerized HTTP stub like **WireMock**. WireMock is NOT an axios mock — it is a real HTTP server that your adapter calls normally over the network, allowing you to control responses without touching provider infrastructure.

## Execution Steps

1. Identify the infrastructure adapter being tested (e.g., MongoRepository, ProviderAdapter).
2. Set up the real dependency (Mongo connection, or WireMock URL).
3. In `beforeEach`, ensure the environment is clean (e.g., clear Mongo collections).
4. In the test, instantiate the adapter with the real connection details.
5. Perform the action and verify the side effect (e.g., document inserted in Mongo, or correct HTTP request sent to WireMock).
6. Format using the Arrange/Act/Assert pattern with explicit comments.

## Decision Gates

| Situation                      | Action                                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Testing a database repository  | Connect to the test DB, insert/read real documents.                                                                                                                                                      |
| Testing a third-party provider | Point the adapter to the provider's sandbox URL, or spin up a local WireMock container as an HTTP stub. WireMock receives real HTTP calls — it is not an in-process mock. Do NOT use `vi.mock('axios')`. |
| A test fails sporadically      | Ensure the database collection is properly cleared in `beforeEach`.                                                                                                                                      |

## Output Contract

Provide the requested integration test using Vitest, ensuring that no internal mocks are used for external boundaries.
