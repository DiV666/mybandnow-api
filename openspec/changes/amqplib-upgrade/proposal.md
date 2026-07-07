# Proposal: amqplib-upgrade

## Intent

Upgrade `amqplib` from 0.10.8 to 2.0.1 to guarantee compatibility with the upcoming production upgrade to RabbitMQ v4, while simultaneously eliminating technical debt by using the native types bundled in the new library version.

## Scope

### In Scope
- Upgrade `amqplib` to version `2.0.1` in `package.json`.
- Remove `@types/amqplib` from `devDependencies`.
- Validate that type imports in `RabbitMQConnection.ts` and `RabbitMQConsumer.ts` resolve correctly.
- Execute unit and integration tests to ensure existing coverage passes.

### Out of Scope
- Adding new `handler-error` listener features (can be handled as a fast follow-up).
- Refactoring `amqplib` connection configuration (e.g., adding `heartbeat: 0` explicitly, as it is already omitted).
- Upgrading other dependencies unrelated to `amqplib`.

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.
> Research `openspec/specs/` before filling this in.

### New Capabilities
None

### Modified Capabilities
None (Pure infrastructure dependency upgrade, no functional capability changes).

## Approach

Since the exploration confirmed zero breaking changes for our specific API usage (we do not use explicit heartbeats, and Node.js 24 satisfies the minimum version requirement), the approach is a simple package version bump. We will remove the redundant `@types/amqplib` dependency, ensuring that TypeScript seamlessly utilizes the types now bundled directly in `amqplib` 2.0.1. Validation relies on our existing robust unit and integration test coverage for the Event Bus.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Bump `amqplib`, remove `@types/amqplib` |
| `package-lock.json` | Modified | Lockfile updates reflecting the new dependency tree |
| `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/` | Modified | Minor type import adjustments if required by the native typings |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unforeseen type mismatch in existing code | Low | Native `amqplib` types generally align with `@types/amqplib`. Fallback is to adjust type imports in the code. |
| Memory leak or edge case in new library version | Low | Integration testing and version 2.0.1 includes fixes for previous known memory leaks. |

## Rollback Plan

Revert the `package.json` changes to downgrade `amqplib` back to `0.10.8`, re-add `@types/amqplib` to `devDependencies`, and run `npm install`.

## Dependencies

- No external prerequisites. Wait for PR review budget.

## Success Criteria

- [ ] `npm run build` succeeds with zero TypeScript errors.
- [ ] All unit and integration tests (`make tests`) pass completely against the current RabbitMQ setup.
- [ ] `@types/amqplib` is successfully removed from the dependency tree.
