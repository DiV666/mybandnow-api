---
name: log-review
description: "Trigger: review logs, inspect observability, audit logging quality, review logging changes. Review service logs and log instrumentation for safety, placement, resilience, and signal quality in this mybandnow-based project."
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root]
  auto_invoke:
    - 'Reviewing service logs'
    - 'Inspecting observability'
    - 'Auditing logging quality'
    - 'Reviewing logging changes'
---

## Activation Contract

Use this skill when a user asks to review service logs, inspect observability, audit log safety, or evaluate a code change that adds or modifies logs.
Review both runtime signal quality and instrumentation quality when both are available.
Treat missing boundary logs, unsafe metadata, and noisy duplication as first-class findings.

## Hard Rules

- Logs belong at boundaries: HTTP controllers, application use cases, event bus publishers/consumers, external-provider adapters, cron jobs, and other infrastructure edges. Do NOT ask for state-change logs inside aggregates, entities, or value objects.
- Raw PII, secrets, auth material, access tokens, refresh tokens, API keys, passwords, cookies, full request/response payloads, and full event attribute dumps are blockers. Prefer masked values, lengths, ids, status transitions, provider names, queue/exchange names, retry metadata, and safe summaries.
- Message names must be structured and grep-friendly, such as `entity.create.started`, `entity.update.failed`, or `domain_event.consume.acknowledged`. Reject vague prose or payload-dump logs.
- Review malformed timestamp paths, malformed message payloads, and unknown throwable paths explicitly. Logging must fall back to sanitized summaries and must never crash while trying to log an error.
- When log behavior changes, require matching regression coverage and preserve the repository's focused-test guardrails.

## Decision Gates

| Situation | Action |
|---|---|
| Reviewing production/service logs only | Reconstruct the flow by boundary: request/use case → persistence or external call → event publish/consume → outcome. Report missing transitions and noisy repetition. |
| Reviewing a code diff that changes logs | Inspect placement, metadata shape, fallback handling, and tests before judging message wording. |
| A log includes sensitive fields | Mark as blocker unless the value is masked, length-only, or reduced to safe identifiers. |
| Multiple logs say the same thing | Keep the boundary transition log; flag the rest as noise unless they add retry, status-change, or failure context. |
| Error handling logs malformed events or unknown throwables | Require sanitized fallback metadata instead of raw payloads or assumptions about `Error` shape. |

## Execution Steps

1. Start with the highest-value hotspots for this mybandnow structure:
   - `src/Contexts/**/apps/**` or controller entrypoints that receive HTTP or broker input
   - `src/Contexts/**/application/**` use cases that start, complete, retry, or fail business operations
   - `src/Contexts/**/infrastructure/**` adapters that call external services, databases, queues, or publish/consume events
   - shared event bus, consumer, subscriber, or transport infrastructure under `src/Contexts/Shared/infrastructure/**`
2. For each path, verify boundary placement: meaningful start/success/failure/state-transition logs at controller, use case, callback, bus, consumer, subscriber, or provider edges; none inside aggregates, entities, or value objects.
3. Inspect metadata safety: no raw PII, secrets, tokens, auth headers, cookies, full request/response payloads, or full event attribute dumps. Prefer masked identifiers, lengths, ids, previous/next status, provider candidates, event ids, retry counts, and queue metadata. Apply the local `security` skill rules when a finding overlaps repository security expectations.
4. Inspect signal quality: structured event names, stable metadata keys, enough context to trace a state change, and no duplicate logs that do not add new meaning.
5. Inspect resilience: malformed `occurredOn` values, poison-event paths, and unknown thrown values must log sanitized fallback context without throwing during logging.
6. If code changed, verify tests cover the new log contract or failure path. When the harness changed, inspect the repo's actual focused-test guards such as `vitest.config.ts`, `cucumber.js`, and any focused-test assertion script that exists locally.
7. When useful, include tiny examples instead of project-specific assumptions. Example safe metadata:
    - `logger.info({ entityId, previousStatus, nextStatus }, 'entity.update.completed')`
    - `logger.error({ provider: providerName, retryCount, error: safeError }, 'external_provider.call.failed')`

## Output Contract

Return a concise review with:
- Scope reviewed: runtime logs, code diff, or both.
- Verdict: good / needs changes / blocked.
- Findings grouped as `Placement`, `Safety`, `Signal`, `Resilience`, and `Tests`.
- For each finding: severity, exact file/log location, why it matters, and the smallest safe fix.
- Explicit confirmation when no raw PII/secrets were found.
- Call out whether the review was generic mybandnow guidance or based on concrete project files.

## References

- `AGENTS.md` — repository architecture, security, and testing expectations.
- `.agents/skills/security/SKILL.md` — local security guardrails for sensitive data, validation, regex escaping, and exception exposure.
- `docs/infrastructure.md` — logging and infrastructure context for the mybandnow.
- `vitest.config.ts` — focused-test guard for Vitest.
- `cucumber.js` — acceptance harness and focused-test entrypoint.
