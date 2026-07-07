---
name: tdd
description: >
  Test-Driven Development workflow for Node.js backend (Hexagonal Architecture).
  Trigger: ALWAYS when implementing features, fixing bugs, or refactoring.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root, backend]
  auto_invoke:
    - 'Implementing feature'
    - 'Fixing bug'
    - 'Refactoring code'
    - 'Working on task'
---

## Activation Contract

Use this skill whenever you are asked to write new business logic, fix a bug, or refactor existing code. This is a MANDATORY workflow. You must follow the Red-Green-Refactor cycle and specifically the Triangulation rule.

## Hard Rules (NEVER Break)

- **The Three Laws of TDD**:
  1. No production code until you have a failing test.
  2. No more test than necessary to fail.
  3. No more code than necessary to pass.
- **Triangulation**: A single test allows "Faking it" (hardcoding). Multiple tests with different inputs FORCE real logic. You MUST triangulate before writing the final production algorithm.
- **Node.js / Vitest Focus**: All commands and testing frameworks must assume a Vitest runner within a Node.js environment.
- **Clock Injection (New Code)**: For new domain logic that depends on the current time, inject a `Clock` interface rather than calling `new Date()` directly. Use a `FixedClock` in tests to avoid flaky behavior. Existing code that uses `new Date()` does not need to be migrated retroactively.
- **Explicit Object Mothers (New Code)**: For new Object Mothers, expose explicit factory methods for edge cases (e.g. `OrderMother.withInvalidStatus()`) in addition to `random()`. Existing Mothers that only have `random()` do not need to be migrated retroactively.

## Decision Gates

| Situation                   | Action                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Fixing a bug                | Write a test that reproduces the bug (RED), then fix it (GREEN).                               |
| Refactoring                 | Run all existing tests to ensure they pass, then refactor. Tests must stay GREEN.              |
| The user asks for a feature | Write the first failing test for the "Happy Path" before writing the Use Case or Domain logic. |

## Execution Steps

1. **Phase 0: Assessment**: Identify if tests exist for the code you are going to write/modify. If not, create the `.test.ts` file.
2. **Phase 1: RED**: Write ONE failing test for the next behavior required. Ensure it fails for the right reason.
3. **Phase 2: GREEN (Fake it)**: Write the absolute minimum code to make the test pass. Hardcoding the return value is ACCEPTABLE and ENCOURAGED for the first test.
4. **Phase 3: TRIANGULATE**: Write a second test with different inputs that breaks the fake implementation. Now, implement the real logic to make both tests pass.
5. **Phase 4: REFACTOR**: Improve the code quality (extract functions, improve naming, apply Hexagonal primitives) while keeping tests GREEN.
6. **Repeat**: Move to the next behavior (Edge cases, errors, empty values).

## Output Contract

When writing code under TDD, present the failing test first. Wait for the user or test runner to confirm it fails, or explicitly explain that you are writing the test first and then provide the minimum code to pass it.
