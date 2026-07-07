---
name: security
description: >
  Security and quality checklist for every implementation task.
  Trigger: ALWAYS before writing any production code and before proposing any commit.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Implementing feature'
    - 'Fixing bug'
    - 'Refactoring code'
    - 'Working on task'
    - 'Adding a RabbitMQ subscriber'
    - 'Creating or modifying a controller'
    - 'Adding a new HTTP endpoint'
    - 'Creating domain aggregates, value objects, or domain events'
    - 'Adding a new use case (command or query)'
---

## Activation Contract

Use this skill on EVERY implementation task in scaffold descendants that keep this Hexagonal Architecture — features, bug fixes, refactors, controllers, consumers, providers, and persistence adapters.
Run the pre-implementation checklist BEFORE writing code and the post-implementation checklist BEFORE proposing any commit or PR.
Do NOT skip this skill because the change looks small.

## Hard Rules (NEVER Break)

- **No sensitive data in logs**: NEVER log raw PII, secrets, auth material, credentials, tokens, cookies, or full request/response payloads. Mask, omit, hash, truncate, or summarize when a value is operationally useful.
- **No secrets in code**: ALL credentials, tokens, keys, and provider secrets MUST come from environment variables validated at startup. NEVER hardcode secrets or embed them in tests, fixtures, examples, or comments.
- **Input validation at boundaries**: ALL incoming HTTP, broker, CLI, or scheduled-job input MUST be validated at the boundary. In this mybandnow, HTTP request contracts belong in the OpenAPI schema; domain value objects enforce invariants as a second layer, not a substitute.
- **Domain invariants via value objects**: ALWAYS enforce business rules in value objects or equivalent domain guards. NEVER bypass domain validation with raw primitives passed deep into the model.
- **Regex from user input must be escaped**: ALWAYS call `MongoCriteriaConverter.escapeRegex()` before building a `RegExp` from user-controlled input used in repository filters or search criteria.
- **Exception details stay internal**: Log enough sanitized detail for diagnosis, but NEVER expose stack traces, `details`, provider payloads, or internal error messages in API responses or external events.
- **Respect Hexagonal boundaries**: `domain/` must not depend on framework, transport, database, or infrastructure code. `application/` orchestrates use cases; `infrastructure/` implements adapters; `apps/` handles entrypoints.

## Pre-Implementation Checklist

Run this BEFORE writing any production code. Answer each item explicitly.

| # | Check | How to verify |
| --- | --- | --- |
| 1 | Will any new log line or emitted event include user-controlled or sensitive fields? | Trace the new data flow and decide what must be masked, omitted, or summarized |
| 2 | Does the change introduce any credential, token, secret, API key, or auth material? | Review config, constants, tests, fixtures, and examples |
| 3 | If this adds or changes an input boundary, where is validation enforced? | Confirm the OpenAPI contract or equivalent boundary schema covers it completely |
| 4 | Does the change build a `RegExp` or dynamic query from user input? | If yes, confirm `escapeRegex()` or equivalent safe construction is used |
| 5 | Does the change add or alter domain fields, identifiers, or state transitions? | If yes, confirm value objects or domain guards enforce invariants |
| 6 | Does the change cross architectural layers? | Confirm imports and responsibilities still match the Hexagonal boundaries |

## Post-Implementation Checklist

Run this BEFORE proposing any commit. Check each item and report the result explicitly.

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | **Relevant tests** | Run the smallest meaningful test scope for the change; zero failures |
| 2 | **No sensitive data in logs** | New log lines and error paths avoid raw PII, secrets, tokens, cookies, and payload dumps |
| 3 | **No secrets in new code** | No hardcoded credentials, keys, or auth material in source, tests, fixtures, or docs |
| 4 | **Layer boundaries** | No framework or infrastructure imports leak into `domain/`; `application/` stays adapter-agnostic |
| 5 | **Boundary validation** | New or changed inputs are validated at the entrypoint contract |
| 6 | **Exceptions mapped safely** | External responses expose only safe messages/status codes; internal diagnostics stay internal |
| 7 | **Config declared safely** | New env vars are validated centrally and documented in the project config pattern |
| 8 | **Wiring updated** | New adapters, controllers, consumers, and use cases are registered in the project's actual DI/composition files |
| 9 | **Data access safety** | Dynamic filters, regex, and persistence queries do not widen access or permit unsafe matching |

## Execution Steps

1. **On task start**: Read this checklist. Run the Pre-Implementation Checklist. State which items are relevant for this specific task.
2. **During implementation**: If a new log line or error path is needed, verify it does not expose sensitive data before writing it.
3. **Before committing**: Run the Post-Implementation Checklist. For each item, state ✅ (pass), ⚠️ (not applicable), or ❌ (fail with reason).
4. **On failure**: Fix the failing item before proposing the commit. NEVER propose a commit with a ❌ open.

## Decision Gates

| Situation | Action |
| --- | --- |
| New logging statement at a boundary | Keep identifiers, counts, statuses, and safe summaries; remove raw payloads and secrets |
| New HTTP endpoint or controller change | Validate the contract in `definition.json`, reject unknown fields when appropriate, and map domain errors to safe HTTP responses |
| New consumer, subscriber, or external adapter | Treat inbound payloads as untrusted; validate before use and sanitize failure logs |
| New env var or provider credential | Add startup validation in the project's central env schema and avoid optional-secret drift |
| New domain exception or failure case | Ensure external callers get a safe status/message while internal logs keep sanitized diagnostics |
| Code builds a filter from query params | Confirm `MongoCriteriaConverter.escapeRegex()` wraps any user-controlled string used in `RegExp` |
| A fix requires a quick test fixture with sensitive-looking data | Use fake/sample values only; never paste real tokens, emails, phones, or customer payloads |

## Output Contract

Before proposing any commit, output a security report with this exact format:

```
## Security & QA Report

### Pre-implementation (assessed at task start)
- [item]: ✅ / ⚠️ not applicable / ❌ [reason]

### Post-implementation
- Relevant tests: ✅ [command/scope] / ❌ [reason]
- No sensitive data in logs: ✅ / ❌ [location]
- No secrets in code: ✅ / ❌ [location]
- Layer boundaries: ✅ / ❌ [violation]
- Boundary validation: ✅ / ⚠️ not applicable / ❌ [reason]
- Exceptions mapped safely: ✅ / ⚠️ not applicable / ❌ [reason]
- Env vars declared safely: ✅ / ⚠️ not applicable / ❌ [reason]
- Wiring updated: ✅ / ⚠️ not applicable / ❌ [reason]
- Data access safety: ✅ / ⚠️ not applicable / ❌ [reason]
```
