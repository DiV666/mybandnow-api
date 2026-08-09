# Source Code Guidelines — mybandnow

## ⛔ HARD GATES — NEVER skip these

These are mandatory stops, not suggestions. An agent that skips any gate is operating outside the rules of this project.

Skills are loaded **lazily** — only when the corresponding gate is reached, not at session start.

### Gate 1 — Before writing any production code

When about to write code for the first time in a task:

1. READ `.agents/skills/tdd/SKILL.md`
2. Output this block before writing a single line of code:

```
## Pre-implementation gate
- tdd skill loaded: ✅ .agents/skills/tdd/SKILL.md
- Failing test planned: <file path and test description>
```

Do NOT proceed to implementation until this block is visible in the conversation.

### Gate 2 — Before proposing any commit

When about to propose or apply a commit:

1. Run `make build-tests` — confirm 0 failures before proposing (the pre-commit hook will also enforce this, but failing early avoids a broken commit proposal)
2. READ `.agents/skills/commit/SKILL.md` — group changes by work unit
3. Output this block before proposing any commit message:

```
## Pre-commit gate
- Unit tests: ✅ X passed, 0 failed
- commit skill loaded: ✅ .agents/skills/commit/SKILL.md
- Proposed commits: <N blocks listed below>
```

Do NOT apply any commit until the user approves the proposed blocks.

---

> **Skills Reference**: For detailed patterns, use these skills:
>
> - [`tdd`](../.agents/skills/tdd/SKILL.md) — Test-Driven Development workflow
> - [`test-unit`](../.agents/skills/test-unit/SKILL.md) — Unit testing using vitest-mock-extended and Object Mothers
> - [`typescript`](../.agents/skills/typescript/SKILL.md) — TypeScript types and interfaces
> - [`zod-4`](../.agents/skills/zod-4/SKILL.md) — Environment variable schema validation
> - [`hexagonal-feature`](../.agents/skills/hexagonal-feature/SKILL.md) — Full vertical slice: domain + application + infrastructure
> - [`openapi-controller`](../.agents/skills/openapi-controller/SKILL.md) — HTTP adapter: definition.json + controller + DI + route
> - [`domain-event`](../.agents/skills/domain-event/SKILL.md) — Domain event design + RabbitMQ subscriber
> - [`object-mother`](../.agents/skills/object-mother/SKILL.md) — Object Mothers, TestCase, Mock patterns
> - [`prisma-indexes`](../.agents/skills/prisma-indexes/SKILL.md) — PostgreSQL index planning
> - [`jira-confluence`](../.agents/skills/jira-confluence/SKILL.md) — Jira issues, Confluence sync, and branch task mapping
> - [`living-blueprint`](../.agents/skills/living-blueprint/SKILL.md) — Maintain docs/ and Confluence in sync after every feature merge

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                        | Skill                |
| ------------------------------------------------------------- | -------------------- |
| Adding a RabbitMQ subscriber                                  | `domain-event`       |
| Adding a RabbitMQ subscriber                                  | `security`           |
| Adding a new HTTP endpoint                                    | `openapi-controller` |
| Adding a new HTTP endpoint                                    | `security`           |
| Adding a new external provider                                | `hexagonal-feature`  |
| Adding a new use case (command or query)                      | `hexagonal-feature`  |
| Adding a new use case (command or query)                      | `security`           |
| Adding criteria to a query handler                            | `prisma-indexes`     |
| Adding filters to a repository                                | `prisma-indexes`     |
| Creating API endpoints                                        | `openapi-controller` |
| Creating a GET/search endpoint                                | `prisma-indexes`     |
| Creating a new module                                         | `hexagonal-feature`  |
| Creating domain aggregates, value objects, or domain events   | `hexagonal-feature`  |
| Creating domain aggregates, value objects, or domain events   | `security`           |
| Creating domain events                                        | `domain-event`       |
| Creating or modifying a controller                            | `openapi-controller` |
| Creating or modifying a controller                            | `security`           |
| Creating test data factories                                  | `object-mother`      |
| Fixing bug                                                    | `security`           |
| Fixing bug                                                    | `tdd`                |
| Implementing feature                                          | `security`           |
| Implementing feature                                          | `tdd`                |
| Modifying schema.prisma indexes                               | `prisma-indexes`     |
| Modifying the Zod env schema                                  | `zod-4`              |
| Reacting to an aggregate state change from another module     | `domain-event`       |
| Refactoring code                                              | `security`           |
| Refactoring code                                              | `tdd`                |
| Testing Application Use Cases                                 | `object-mother`      |
| Testing Application Use Cases                                 | `test-unit`          |
| Testing Apps layer controllers                                | `openapi-controller` |
| Testing Apps layer controllers                                | `test-acceptance`    |
| Testing Domain Aggregates                                     | `object-mother`      |
| Testing Domain Aggregates                                     | `test-unit`          |
| Testing HTTP external service integrations                    | `test-integration`   |
| Testing Infrastructure layer adapters                         | `test-integration`   |
| Working on task                                               | `security`           |
| Working on task                                               | `tdd`                |
| Writing API E2E tests                                         | `test-acceptance`    |
| Writing TypeScript types/interfaces                           | `typescript`         |
| Writing acceptance tests with Cucumber.js                     | `test-acceptance`    |
| Writing integration tests against real PostgreSQL or RabbitMQ | `test-integration`   |
| Writing unit tests                                            | `object-mother`      |
| Writing unit tests                                            | `test-unit`          |

---

## CRITICAL RULES — NON-NEGOTIABLE

### Domain Layer (`domain/`)

- **ALWAYS**: emit a domain event for every aggregate state change via `this.record(new XxxDomainEvent(...))`.
- **ALWAYS**: validate invariants in value object constructors; throw `InvalidArgumentException` on violation.
- **ALWAYS**: use value objects — never pass raw primitives across domain boundaries.
- **ALWAYS**: declare repository interfaces (`XxxPersistenceRepository`, `XxxCommunicationsRepository`) in `domain/repository/` — no concrete imports.
- **NEVER**: import from `application/` or `infrastructure/` inside `domain/`.
- **NEVER**: call external services, databases, or I/O from domain classes.

### Application Layer (`application/`)

- **ALWAYS**: create one `XxxCommand` / `XxxCommandHandler` pair per write use case.
- **ALWAYS**: create one `XxxQuery` / `XxxQueryHandler` pair per read use case.
- **ALWAYS**: inject repository interfaces from `domain/repository/` — never concrete implementations.
- **NEVER**: import from `infrastructure/` inside `application/`.
- **NEVER**: put business logic in handlers — delegate to aggregate methods.

### Infrastructure Layer (`infrastructure/`)

- **ALWAYS**: use `PrismaClient` for persistence.
- **ALWAYS**: implement the domain repository interface defined in `domain/repository/`.
- **NEVER**: import from `application/` inside `infrastructure/`.
- **NEVER**: put domain logic inside repositories or providers.

### Apps Layer (`apps/`)

- **ALWAYS**: define the OpenAPI operation in `definition.json` before writing the controller.
- **ALWAYS**: dispatch through the command or query bus — never call use cases directly.
- **ALWAYS**: map domain exceptions to HTTP status codes in the controller's `exceptions()` method.
- **ALWAYS**: register controllers in `appsDependencies.ts` and export route handlers in the routes index.
- **NEVER**: import use cases, repositories, or domain classes directly — use the DI container.

---

## DECISION TREES

### Adding a new endpoint

```
1. Add operation to definition.json (operationId must match route handler export name)
2. Write controller in apps/mybandnow/backend/controllers/<module>/
3. Create DI file in config/dependency-injection/controllers/<module>/
4. Export handler from apps/mybandnow/backend/routes/index.ts
5. Register controller in appsDependencies.ts
6. Write acceptance test in test/acceptance/features/<module>/
```

### Adding a new use case

```
1. Create Command/Query + Handler in application/<action>/
2. Create DI file in apps/mybandnow/backend/config/dependency-injection/use-cases/<module>/
3. Register in the corresponding dependency registration file under `apps/mybandnow/backend/config/dependency-injection/`
4. Write unit test: XxxTestCase.ts + XxxCommandMother.ts + Xxx.unit.test.ts
```

### Adding a new external provider

```
1. Add provider class to src/Contexts/Identity/<Module>/infrastructure/http/
2. Register in the DI infrastructure dependencies
3. Add provider name to the corresponding const object in domain/value-object/
4. Add paired env vars (ORIGIN + TOKEN) to env.ts with .refine() cross-validation
5. Write integration test in test/unit-integration/Contexts/Identity/<Module>/infrastructure/
```

### New aggregate state

```
1. Add value to the status const object (as const)
2. Add factory method on the aggregate (e.g., markAsSent())
3. Create the corresponding DomainEvent class
4. Update fromPrimitives() / toPrimitives() if new fields are introduced
5. Add unit test for the new state transition
```

---

## TECH STACK

| Concern        | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Runtime        | Node.js 24 / TypeScript 6                                |
| HTTP framework | Express 5 + openapi-backend                              |
| Database       | PostgreSQL via `Prisma`                                  |
| Messaging      | RabbitMQ via amqplib (`RabbitMQEventBus`)                |
| Auth           | Local JWT (`LocalJwtBearerToken`)                        |
| DI container   | node-dependency-injection (`ContainerBuilder`)           |
| Env validation | Zod (`src/Contexts/Shared/infrastructure/config/env.ts`) |
| Build          | ESBuild (`esbuild.config.js`)                            |

---

## PROJECT STRUCTURE

```
src/
├── apps/
│   └── mybandnow/backend/
│       ├── start.ts                         # Bootstrap and graceful shutdown
│       ├── MybandnowBackendApp.ts         # App init (EventBus, Sentry)
│       ├── server.ts                        # Express + openapi-backend wiring
│       ├── controllers/<module>/            # HTTP controllers (one per endpoint)
│       ├── routes/
│       │   ├── index.ts                     # HandlerMap spread
│       │   ├── <module>.route.ts            # Route handlers per module
│       │   └── openapiBackendRoute.ts       # notFound, validationFail, unauthorizedHandler
│       ├── middlewares/                     # CorrelationId, TraceReqAndRes, CLS
│       ├── subscribers/                     # Domain event subscribers
│       └── config/
│           ├── swagger/definition.json      # OpenAPI specification (source of truth)
│           └── dependency-injection/
│               ├── controllers/<module>/    # Controller DI registrations
│               ├── infrastructure/<module>/ # Repository DI registrations
│               ├── use-cases/<module>/      # Use case DI registrations
│               └── dependencies/            # appsDependencies.ts, shared/mybandnow registrations
│
└── Contexts/
    ├── Shared/
    │   ├── domain/                          # Base classes: Command, Query, AggregateRoot,
    │   │                                    # DomainEvent, EventBus, Logger, value objects
    │   └── infrastructure/
    │       ├── config/env.ts                # Zod env schema (fail-fast at startup)
    │       ├── EventBus/RabbitMQ/           # RabbitMQ event bus implementation
    │       ├── persistence/prisma/          # Prisma extensions and outbox
    │       └── service/                     # External HTTP client factories
    └── Identity/
        ├── Shared/                          # Shared configurations
        └── <Module>/                        # Module aggregate
            ├── application/                 # Commands, queries, handlers
            ├── domain/                      # Aggregate, value objects, repository interfaces
            └── infrastructure/              # Prisma repos, HTTP providers
```

---

## NAMING CONVENTIONS

| Entity                                | Pattern                                  | Example                                                            |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| Aggregate                             | `<Name>`                                 | `Order`, `Config`                                                  |
| Value object                          | `<Aggregate><Concept>`                   | `OrderId`, `OrderStatus`, `OrderAmount`                            |
| Domain event                          | `<Aggregate><PastAction>DomainEvent`     | `OrderCreatedDomainEvent`, `OrderCancelledDomainEvent`             |
| Exception                             | `<Aggregate><Condition>Exception`        | `OrderNotFoundException`, `OrderInvalidStatusException`            |
| Repository interface (persistence)    | `<Aggregate>PersistenceRepository`       | `SmsPersistenceRepository`                                         |
| Repository interface (communications) | `<Aggregate>CommunicationsRepository`    | `SmsCommunicationsRepository`                                      |
| Repository implementation             | `<Aggregate>PrismaRepository`            | `SmsPrismaRepository`                                              |
| Use case                              | `<Aggregate><Action>`                    | `SmsSend`, `SmsSearch`                                             |
| Command                               | `<UseCase>Command`                       | `SmsSendCommand`                                                   |
| Command handler                       | `<UseCase>CommandHandler`                | `SmsSendCommandHandler`                                            |
| Query                                 | `<UseCase>Query`                         | `SmsSearchQuery`                                                   |
| Query handler                         | `<UseCase>QueryHandler`                  | `SmsSearchQueryHandler`                                            |
| Response DTO                          | `<UseCase>Response`                      | `SmsSearchResponse`                                                |
| Controller                            | `<HttpMethod><Aggregate>Controller`      | `SmsPostSendController`, `SmsGetSearchController`                  |
| Route handler export                  | `<aggregate><HttpMethod><Action>`        | `orderPostCreate`, `orderGetSearch`                                |
| DI service key (module services)      | `<Context>.<Module>.<ClassName>`         | `Identity.Order.OrderPrismaRepository`                             |
| DI service key (app controllers)      | `Apps.<App>.<Layer>.<Group>.<ClassName>` | `Apps.Mybandnow.Backend.controllers.OrderPostCreateController`     |
| DI service key (shared/cross-cutting) | `Shared.<ClassName>`                     | `Shared.EventBus`, `Shared.OutboxPublisher`, `Shared.BunyanLogger` |
| Test mother                           | `<Entity>Mother`                         | `OrderMother`, `OrderIdMother`, `OrderStatusMother`                |
| Test case                             | `<UseCase>TestCase`                      | `SmsSendTestCase`                                                  |
| Test command mother                   | `<UseCase>CommandMother`                 | `SmsSendCommandMother`                                             |

---

## COMMANDS

```bash
# Unit tests only (no infra required)
make unit-tests

# Integration tests (requires PostgreSQL + RabbitMQ via Docker)
make integration-tests

# Acceptance tests — Cucumber E2E (requires full Docker stack)
make acceptance-tests

# All tests
make tests

# Build
npm run build

# Lint + format
npm run lint
npm run format:fix
```

---

## QA CHECKLIST

- [ ] `make unit-tests` passes with no failures
- [ ] Integration tests pass if any infrastructure code was touched
- [ ] New domain state changes emit the corresponding domain event
- [ ] New endpoints have an OpenAPI operation defined in `definition.json`
- [ ] Domain exceptions are mapped to HTTP status codes in the controller's `exceptions()`
- [ ] Layer boundaries are respected: no infra imports in domain or application
- [ ] No sensitive data in logs: PII masked or omitted before logging
- [ ] Env vars added to `env.ts` with Zod validation; paired provider vars use `.refine()`
- [ ] New controller registered in `appsDependencies.ts`
- [ ] New use case DI registered in the corresponding dependency registration file

---

## API CONVENTIONS (OpenAPI + REST)

The source of truth for the API contract is `src/apps/mybandnow/backend/config/swagger/definition.json`.

- The `operationId` in `definition.json` **must** match the function name exported in routes index.
- Request body validation is handled by `openapi-backend` before the controller runs.
- Use `additionalProperties: false` on request schemas to block unknown fields.
- Path parameters come from `context.request.params`, not `req.params`.

### HTTP Status Codes

| Code              | Use When                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `200 OK`          | Successful GET, PATCH with response body, DELETE with response    |
| `201 Created`     | POST created resource                                             |
| `202 Accepted`    | Async operation started                                           |
| `204 No Content`  | Successful DELETE, PATCH with no response body                    |
| `400 Bad Request` | Invalid query params, malformed request, domain validation failed |
| `403 Forbidden`   | Authentication ok but no permission                               |
| `404 Not Found`   | Resource doesn't exist                                            |
| `409 Conflict`    | Aggregate state conflict, duplicate ID                            |

### CQRS Query Parameters (Criteria Pattern)

For search/list endpoints, map standard query parameters to the CQRS `Query` DTO, which the Handler passes to the Infrastructure layer:

- **Pagination**: `?page[number]=1&page[size]=25`
- **Filtering**: `?filter[status]=SENT`
- **Sorting**: `?sort=-createdAt` (descending) or `?sort=createdAt` (ascending)

```json
// definition.json — operation pattern
{
  "operationId": "entityPostCreate",
  "requestBody": {
    "content": { "application/json": { "schema": { "$ref": "#/components/schemas/EntityCreateRequest" } } }
  },
  "responses": { "201": { "description": "Created" }, "400": { "$ref": "#/components/responses/BadRequest" } }
}
```

```typescript
// Controller pattern
export default class EntityPostCreateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    await this.commandBus.dispatch(new EntityCreateCommand(req.body.id, req.body.name));
    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return { EntityInvalidNameException: httpStatus.BAD_REQUEST };
  }
}
```
