# Exploration: amqplib upgrade 0.10.8 → 2.0.1

**Change**: `amqplib-upgrade`
**Date**: 2026-06-12
**Author**: sdd-explore sub-agent

---

## Current State

The project uses `amqplib@0.10.8` with external type definitions via `@types/amqplib@0.10.6`.

### Active RabbitMQ Infrastructure Files

| File | Role |
|------|------|
| `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.ts` | Core connection, channel lifecycle, reconnect, publish, consume, ack/nack |
| `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumer.ts` | Message handler, retry/dead-letter routing logic |
| `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBus.ts` | EventBus façade: wires configurer, consumers, failover publisher |
| `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigurer.ts` | Topology setup: exchanges, queues, dead-letter bindings |
| `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumerFactory.ts` | Factory for `RabbitMQConsumer` instances |

### How Connection Is Established (`RabbitMQConnection.amqpConnect`)

```typescript
await amqplib.connect({
  protocol,     // 'amqp' or 'amqps'
  hostname,
  port,
  username,
  password,
  vhost
  // ← heartbeat is NOT passed at all
});
```

### Channel Type

`ConfirmChannel` — created via `conn.createConfirmChannel()`.
Used for confirmed publishes with callbacks: `channel.publish(exchange, key, content, options, (err) => ...)`.

### Error Handling Pattern (Current)

```typescript
// Connection level
connection.on('error', (err) => { healthStatus.setRabbitHealth('KO'); });
connection.on('close', () => { void this.reconnect(); });

// Channel level: NO explicit error/close listeners
// The 'handler-error' event (added in v1.0.7) is NOT used
```

### Features Used

| Feature | Used? | Notes |
|---------|-------|-------|
| `amqplib.connect()` | ✅ | No heartbeat option |
| `createConfirmChannel()` | ✅ | For confirmed publishes |
| `channel.publish(cb)` | ✅ | ConfirmChannel publish with callback |
| `channel.consume()` | ✅ | Message consumer |
| `channel.prefetch()` | ✅ | Set to 1 |
| `channel.assertExchange()` | ✅ | Topic exchanges |
| `channel.assertQueue()` | ✅ | Durable queues with DLX args |
| `channel.bindQueue()` | ✅ | Routing key bindings |
| `channel.ack()` | ✅ | |
| `channel.nack()` | ✅ | |
| `channel.deleteQueue()` | ✅ | Used in test cleanup |
| `channel.get()` | ❌ | Not used anywhere |
| `connection 'handler-error'` | ❌ | Not used (v1.0.7 addition) |
| `heartbeat: 0` option | ❌ | Not passed — SAFE |

---

## Affected Areas

- `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.ts` — primary amqplib consumer
- `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumer.ts` — uses `ConsumeMessage` type from amqplib
- `package.json` — version bump + `@types/amqplib` removal
- `test/unit-integration/Contexts/Shared/infrastructure/EventBus/RabbitMQ/` — integration + unit tests

---

## Breaking Change Impact Assessment

### v2.0.0 Breaking Changes

| Breaking Change | Our Code | Impact |
|----------------|----------|--------|
| `heartbeat: 0` now disables heartbeats (previously used server default) | We pass **no** `heartbeat` option at all | **NONE** — we are not affected |

### v1.0.0 Breaking Changes

| Breaking Change | Our Code | Impact |
|----------------|----------|--------|
| Minimum Node.js v18 required | We run Node.js 24 | **NONE** — requirement exceeded |
| Test suite migrated (Mocha → Node test runner) | Our tests are Vitest/Cucumber | **NONE** — internal to amqplib |

**Conclusion: ZERO code changes required for the migration.**

---

## Enhancements Available After Upgrade

| Version | Enhancement | Applicable? | Action |
|---------|-------------|-------------|--------|
| v2.0.1 | Removed `buffer-more-ints` dependency (uses native BigInt) | ✅ | Automatic — cleaner dep tree |
| v1.2.0 | Bundled TypeScript type definitions | ✅ | **Remove `@types/amqplib` from devDeps** |
| v1.0.7 | New `handler-error` event on connections/channels | ✅ Optional | Add to improve observability |
| v1.0.6 | Fixed `channel.get()` callback error handling | ❌ Not used | N/A |
| v1.0.5 | Fixed ConfirmChannel callbacks dropped on channel close | ✅ | Automatic bug fix |
| v1.0.4 | Fixed memory leak in ConfirmChannel.publish when channel closed | ✅ | Automatic bug fix |

---

## Migration Risks

| Area | Risk Level | Detail |
|------|-----------|--------|
| Heartbeat behavior | **NONE** | `heartbeat` option not used in our code |
| ConfirmChannel publish | **LOW** | v1.0.4 fixed a memory leak we may have been experiencing silently |
| Bundled types vs `@types/amqplib` | **LOW** | Must remove `@types/amqplib`; if not removed, type conflicts are likely (two `amqplib` type declarations). Build step will surface this immediately. |
| TypeScript compatibility | **LOW** | v1.2.0 bundled types may differ subtly from `@types/amqplib@0.10.6`. `npm run build` will catch any mismatches. |
| `ConsumeMessage` type | **LOW** | Used in `RabbitMQConsumer.ts`. Type is stable across versions but must verify after bundled types swap. |
| Runtime behavior on reconnect | **LOW** | Our reconnect logic registers consumers on the new channel — this pattern is unchanged in v2. |
| Integration test environment | **MEDIUM** | Integration tests require a live RabbitMQ instance. The v4 protocol compatibility is the actual goal of this upgrade; must run integration tests against RabbitMQ v4 to validate. |
| Zero-dep `buffer-more-ints` removal | **NONE** | Pure benefit — native BigInt is faster and removes a transitive dep |

---

## Approaches

### Option A — Simple version bump (RECOMMENDED)

1. `npm install amqplib@2.0.1`
2. Remove `@types/amqplib` from `package.json` devDependencies
3. `npm run build` — verify 0 TypeScript errors
4. `make unit-tests` — verify 0 failures
5. `make integration-tests` — verify 0 failures (against RabbitMQ v4)

**Pros:**
- Minimal diff — only `package.json` changes
- No production code changes needed
- All bug fixes (memory leak, ConfirmChannel callbacks) included automatically
- Bundled types → no more DefinitelyTyped lag

**Cons:**
- `@types/amqplib` removal could surface latent type inconsistencies

**Effort:** LOW (< 30 min including test runs)

---

### Option B — Version bump + `handler-error` observability

Same as Option A, plus:

6. Add `channel.on('handler-error', ...)` listener after `createConfirmChannel()` in `RabbitMQConnection.amqpChannel()`

```typescript
channel.on('handler-error', (err) => {
  this.logger.error(err, 'RabbitMQ channel handler error');
});
```

**Pros:**
- Better error visibility for channel-level handler failures
- Aligns with amqplib v1.0.7 best practices

**Cons:**
- Tiny code change in production file → requires TDD gate + new unit test

**Effort:** LOW–MEDIUM (adds ~1–2h for TDD, test, commit)

---

## Recommendation

**Start with Option A.** Zero breaking changes means the upgrade is purely mechanical.

The path is: bump version → remove `@types/amqplib` → build → unit tests → integration tests.

Once confirmed green, consider adding the `handler-error` listener (Option B extension) as a separate, focused commit. This keeps the migration commit minimal and reviewable.

---

## Risks Summary

| Risk | Level | Mitigation |
|------|-------|------------|
| Heartbeat breaking change | NONE | Not used |
| Node.js version | NONE | Node 24 >> min 18 |
| `@types/amqplib` type conflict | LOW | Remove it; build will catch any issues |
| ConfirmChannel type shape delta | LOW | `npm run build` catches it immediately |
| RabbitMQ v4 wire protocol | MEDIUM | Run `make integration-tests` against real RabbitMQ v4 |
| Reconnect logic regression | LOW | Well-covered by integration test (consume after publish) |
| ConfirmChannel memory leak (v1.0.4) | LOW (was silent risk) | Fixed automatically by upgrade |

---

## Testing Strategy

### What's Already Covered ✅

| Scenario | Test File | Type |
|----------|-----------|------|
| Publish → consume flow | `RabbitMQEventBus.integration.test.ts` | Integration |
| Retry on subscriber failure | `RabbitMQEventBus.integration.test.ts` | Integration |
| Dead-letter after max retries | `RabbitMQEventBus.integration.test.ts` | Integration |
| Message ack on success | `RabbitMQConsumer.unit.test.ts` | Unit |
| Retry on parse error | `RabbitMQConsumer.unit.test.ts` | Unit |
| Dead-letter on max retry | `RabbitMQConsumer.unit.test.ts` | Unit |
| Nack on handleError failure | `RabbitMQConsumer.unit.test.ts` | Unit |
| Queue args (DLX, TTL) | `RabbitMQConnection.unit.test.ts` | Unit |
| Failover publisher on publish fail | `RabbitMQEventBus.unit.test.ts` | Unit |

### Gaps to Address for Migration Validation

| Gap | Priority | Why |
|-----|----------|-----|
| Reconnection after connection drop | MEDIUM | The reconnect path (`reconnect()`, `scheduleReconnect()`) has no integration test — only unit coverage via mocks. A reconnect integration test would validate amqplib v2 works correctly when the connection drops. |
| `handler-error` event (if Option B chosen) | LOW | New feature requires a unit test verifying the logger is called |
| RabbitMQ v4 specific features (e.g. AMQP 1.0 if applicable) | LOW | Standard AMQP 0-9-1 usage remains unchanged; no new v4 APIs used |

### Recommended Test Run Order Post-Upgrade

```bash
npm run build          # Type check — catches @types/amqplib removal issues
make unit-tests        # Fast validation — no infra needed
make integration-tests # Full RabbitMQ v4 protocol validation
```

---

## Ready for Proposal

**Yes.** The migration is low-risk and well-understood:
- No code changes required (Option A)
- Clear `package.json` diff: bump version + remove `@types/amqplib`
- Existing test suite provides sufficient coverage for validation
- Optional enhancement (Option B: `handler-error`) can be a separate follow-up task
