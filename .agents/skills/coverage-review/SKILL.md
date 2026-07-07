---
name: coverage-review
description: "Trigger: coverage review, test coverage, lcov, build-tests. Review merged coverage, enforce the 90% target, and report overall metrics plus weakest hotspots."
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root]
  auto_invoke:
    - 'Reviewing test coverage'
---

## Activation Contract

Use this skill when a user asks to review project coverage, validate a coverage target, or inspect merged test coverage artifacts after running the full repository suite.
Treat this repository's coverage workflow as concrete project knowledge, not generic advice.

## Hard Rules

- Run `make build-tests` for coverage review unless the user explicitly restricts command execution. Do NOT rely on `make unit-tests`, `make tests`, or isolated Vitest output as the final coverage verdict.
- Treat `make build-tests` as the coverage workflow for this repo: it runs a single `vitest run --coverage` invocation covering both the `unit` and `integration` projects defined in `vitest.config.ts`, so V8 coverage is aggregated natively by Vitest across both — there is no external merge tool (`nyc`) involved anymore. **Acceptance tests are NOT part of this coverage number** — they run under a different engine (c8) and mixing coverage across engines is exactly what corrupted per-file statement maps in the previous nyc-merge-based pipeline (files verified at 100% showed up as 30-60% once acceptance was merged in, with no code change to explain it). Unit+integration already reach the 90% target on their own.
- Acceptance tests still MUST be run and MUST pass before a change is considered done — run them separately with `make acceptance-tests` (no coverage instrumentation). This is required precisely so nothing is skipped locally that would only surface as a CI failure later; it is just decoupled from the coverage percentage, not decoupled from the review.
- Verify coverage artifacts under `reports/coverage`, especially `reports/coverage/lcov-report/index.html` and `reports/coverage/lcov.info` (both produced directly by Vitest's `v8` coverage provider).
- If the coverage percentage reported by an external tool (e.g. SonarQube) disagrees with the local Vitest report, do not assume the local number is wrong — check `sonar-project.properties` first: `sonar.coverage.exclusions` removes files from Sonar's denominator entirely, which alone explains most local-vs-Sonar deltas without any tooling bug.
- The review passes only when overall unit+integration coverage is above 90% AND `make acceptance-tests` passes. Below target, report the overall metrics and the weakest hotspots that pull the project down.
- When recommending new tests to raise coverage, do not settle for line-count filler. Structure every new test so it asserts one clear behavior instead of padding coverage numbers:
  - Unit and integration tests (`test/unit-integration/`) — use **AAA (Arrange-Act-Assert)**.
  - Acceptance tests (`test/acceptance/features/*.feature`) already run on Cucumber/Gherkin — keep using native **Given-When-Then** steps, do not force AAA there.

## Decision Gates

| Situation | Action |
| --- | --- |
| Coverage artifacts are missing or stale | Run `make build-tests` before judging coverage. |
| Overall unit+integration coverage is above 90% | Report the metrics, then run `make acceptance-tests` and confirm it passes before declaring the review passed. |
| Overall unit+integration coverage is below 90% | Flag the failure, list the overall metrics, and identify the weakest files or modules from the merged report. |
| `make acceptance-tests` fails | Flag it as a blocking failure independent of the coverage number — do not let a passing coverage gate mask a broken acceptance suite. |
| Commands cannot be executed | Review the existing `reports/coverage` artifacts and state that the verdict depends on artifact freshness. |

## Execution Steps

1. Run `make build-tests` (unit + integration coverage only).
2. Confirm the merged coverage artifacts exist in `reports/coverage/`.
3. Read the overall coverage metrics from the generated report output and supporting artifacts.
4. Check whether the overall coverage is above 90%.
5. If coverage is below target, inspect `reports/coverage/lcov.info` and `reports/coverage/lcov-report/index.html` to identify the weakest hotspots worth fixing first.
6. Run `make acceptance-tests` and confirm it passes — required for every review, regardless of the coverage number.
7. Return a concise review with the pass/fail verdict, overall metrics, artifact locations, acceptance test result, and hotspot guidance when needed.

## Output Contract

Return a concise coverage review with:
- The command(s) used.
- Whether merged coverage artifacts were generated.
- Overall unit+integration coverage metrics.
- A pass/fail verdict against the 90% target.
- The `make acceptance-tests` result (pass/fail) — a coverage pass does not substitute for this.
- The weakest hotspots when coverage is below target.

## References

- `Makefile` — defines `make build-tests` (unit+integration coverage) and `make acceptance-tests` (separate, uninstrumented).
- `vitest.config.ts` — defines the `unit` and `integration` projects and the shared `coverage` config that aggregates both.
- `docs/testing.md` — documents the repository coverage workflow and artifact directory.
- `sonar-project.properties` — defines `sonar.coverage.exclusions`, which can make Sonar's percentage differ from the local report by design.
