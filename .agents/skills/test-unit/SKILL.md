---
name: test-unit
description: >
  Unit testing patterns for Hexagonal Architecture (Domain and Application layers).
  Trigger: When writing unit tests for Domain (Aggregates, Value Objects) or Application (Commands, Queries, Handlers).
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root, backend]
  auto_invoke:
    - 'Writing unit tests'
    - 'Testing Application Use Cases'
    - 'Testing Domain Aggregates'
---

## Activation Contract

Use this skill EXCLUSIVELY when testing the **Domain** or **Application** layers.
Do NOT use this skill for tests involving real databases, HTTP servers, or external services. For Infrastructure tests, use `test-integration`. For REST API tests, use `test-acceptance`.

## Hard Rules (NEVER Break)

- **Absolute Isolation**: PROHIBITED to make real network requests or read from real databases.
- **Mock Everything External**: You MUST mock all Infrastructure adapters (Persistence Repositories, Event Bus) using `vitest-mock-extended`.
- **Domain Event Verification**: Every Use Case test that modifies state MUST verify that the aggregate published the correct `DomainEvent` to the `EventBus`.
- **Clock Injection (New Code)**: For new domain logic that depends on the current time, inject a `Clock` interface and use a `FixedClock` in tests. Existing code that calls `new Date()` directly does not need to be migrated retroactively.
- **Explicit Edge Cases in Object Mothers (New Code)**: For new Object Mothers, expose explicit methods for edge cases (e.g. `OrderMother.withInvalidStatus()`) in addition to `random()`. Existing Mothers that only expose `random()` do not need to be migrated retroactively.

## Execution Steps

1. Identify the layer being tested (Domain or Application).
2. Create the Arrange (Given) block:
   - Instantiate necessary mocks (`vitest-mock-extended`).
   - Use explicit Object Mother methods to generate test data (`OrderMother.random()` for happy path, `OrderMother.withInvalidStatus()` for error paths).
3. Create the Act (When) block:
   - Call the Domain method or Application Use Case.
4. Create the Assert (Then) block:
   - Verify state changes, errors thrown, or correct mocked interactions (e.g. `eventBus.publish`).
5. Ensure the test follows the AAA (Arrange, Act, Assert) pattern with comments.

## Decision Gates

| Situation                                      | Action                                                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The test requires saving to MongoDB            | STOP. That is an integration test. Switch to `test-integration`.                                                                                                |
| You need to test a specific validation failure | Create an explicit method in the Object Mother like `MyObjectMother.withInvalidField()`.                                                                        |
| The test depends on the current time           | For new code: inject a `FixedClock`. For existing code that uses `new Date()` directly, assert on approximate ranges or exclude timestamps from the comparison. |

## Output Contract

When writing tests, return only the fully implemented test file with AAA comments, using the Vitest framework.
