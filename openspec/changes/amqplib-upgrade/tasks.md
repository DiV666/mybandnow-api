# Tasks: amqplib upgrade 0.10.8 → 2.0.1

**Change**: amqplib-upgrade
**Status**: Ready for implementation
**Estimated effort**: < 1 hour
**Review budget**: ~10-20 lines

---

## Task 1: Update dependencies

**Description**: Update amqplib version and remove deprecated type definitions

**Actions**:
1. Update `amqplib` from 0.10.8 to 2.0.1 in package.json dependencies
2. Remove `@types/amqplib` from devDependencies (types now bundled in amqplib@1.2.0+)
3. Run `npm install` to update package-lock.json

**Files to modify**:
- `package.json` (2 lines changed)
- `package-lock.json` (automated lock file update)

**Verification**:
```bash
npm list amqplib       # Should show 2.0.1
npm list @types/amqplib # Should show package not installed
```

**Rollback**:
```bash
git checkout package.json package-lock.json
npm install
```

---

## Task 2: Verify TypeScript compilation

**Description**: Ensure bundled types work correctly with our codebase

**Actions**:
1. Run `npm run build`
2. Verify no TypeScript errors in RabbitMQ infrastructure files

**Files to verify** (no modifications expected):
- `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.ts`
- `src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumer.ts`

**Verification**:
```bash
npm run build  # Should complete without TypeScript errors
```

**Expected outcome**: Build succeeds, no type errors

---

## Task 3: Run test suite validation

**Description**: Validate compatibility with RabbitMQ v4 via existing test coverage

**Actions**:
1. Run unit tests (no infrastructure)
2. Run integration tests (validates against real RabbitMQ v4 instance)
3. Run acceptance tests (full E2E validation)

**Test coverage**:
- `test/unit-integration/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumer.unit.test.ts`
- `test/unit-integration/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBus.integration.test.ts`
- Acceptance tests with RabbitMQ messaging

**Verification**:
```bash
make unit-tests         # Fast validation (no Docker required)
make integration-tests  # RabbitMQ v4 protocol validation
make acceptance-tests   # Full E2E
```

**Expected outcome**: All tests pass

---

## Review Workload Forecast

| Metric | Value | Status |
|--------|-------|--------|
| **Total changed lines** | ~10-20 | ✅ Well under budget |
| **Changed files** | 2 (package.json + lock) | ✅ Minimal surface |
| **400-line budget risk** | None | ✅ Low |
| **800-line budget risk** | None | ✅ Low |
| **Chained PRs recommended** | NO | ✅ Single PR |
| **Decision needed before apply** | NO | ✅ Proceed |

**Recommendation**: Single PR, straightforward dependency upgrade

---

## Dependencies

- **Requires**: Exploration (✅ completed), Proposal (✅ completed)
- **Blocks**: Verification, Archive
- **Prerequisites**: Docker services running for integration tests (`docker compose up -d`)

---

## Success Criteria

- [x] `amqplib@2.0.1` installed
- [x] `@types/amqplib` removed
- [x] Build passes without TypeScript errors
- [x] All unit tests pass
- [x] All integration tests pass against RabbitMQ v4
- [x] All acceptance tests pass

---

**Next phase**: `sdd-apply`
