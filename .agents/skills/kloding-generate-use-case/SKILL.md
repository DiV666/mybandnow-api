---
name: rubricae-generate-use-case
description: "Trigger: create use case, generate use case, nuevo caso de uso, rb generate use-case, rb g uc. Generate Rubricae use cases and wire domain events, repository, and DI non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to generate a use case, command handler, query handler, or a full CRUD module for a Rubricae domain.

---

## Hard Rules

1. **Domain must exist first** — `rb g a` before any `rb g uc`. Use case generation validates the aggregate exists.
2. **Always non-interactive** — pass all 3 positional args; the CLI prompts if any is missing.
3. **PascalCase for context and module** — `Clitest`, `Widget`.
4. **Actions are additive** — each `rb g uc` call adds one action. Generate them in order: `create → update → remove → search → matchByCriteria`. **Custom actions** (e.g., `sendEmail`) are also fully supported via CLI and TUI.
5. **`rb g m context` generates all 5 actions at once** — use it for a full CRUD slice.
6. **Domain events are generated here, not in `rb g a`** — `WidgetCreatedDomainEvent.ts` is created when you run `rb g uc Clitest Widget create`.
7. **`static create()`, `update()`, `remove()` are added to the aggregate here** — not in `rb g a`.
8. **Custom Use Cases Support**: When generating custom use cases (e.g. `sendEmail`), the CLI automatically parses the input to `camelCase`. If invoked interactively (or via TUI), it will prompt for the Bus type (`Command` or `Query`). If invoked non-interactively, you can specify the bus type using a colon (e.g., `sendEmail:command`, `sendEmail:c`, `sendEmail:query`, `sendEmail:q`). Defaults to `CommandBus` if none is provided. It also validates to prevent duplicating existing actions.

---

## Command Reference

```bash
# Single use case
rb generate use-case <Context> <Module> <action>
# alias: rb g uc <Context> <Module> <action>

# actions: create | update | remove | search | matchByCriteria | <customAction>
# For custom actions, you can specify the bus type via colon (Command or Query):
# rb g uc <Context> <Module> sendEmail:command

# Full CRUD module (domain + all 5 use cases)
rb generate module context <Context> <Module>
# alias: rb g m context <Context> <Module>
```

---

## What Each Action Generates

### `create`
| File | Description |
|------|-------------|
| `application/create/WidgetCreator.ts` | Use case — checks existence, calls `Widget.create(params, clock)`, saves, publishes |
| `application/create/CreateWidgetCommand.ts` | Command DTO |
| `application/create/CreateWidgetCommandHandler.ts` | Command handler |
| `domain/WidgetCreatedDomainEvent.ts` | Domain event (flat in `domain/`) |
| `domain/Widget.ts` | Updated — `static create()` added with `record(event)` |
| `domain/repository/WidgetPersistenceRepository.ts` | Created + `save()` + `search()` added |
| `infrastructure/persistence/WidgetMongoRepository.ts` | Created — transactional `save()` with Outbox |
| `di/use-cases/widget/widgetCreator.dependency.ts` | DI registration with `Shared.Clock` as 4th arg |
| `test/.../create/WidgetCreator.unit.test.ts` | Unit test |
| `test/.../create/CreateWidgetCommandMother.ts` | Command mother |
| `test/.../create/WidgetCreatorTestCase.ts` | TestCase with `clock(): FakeClock` |
| `test/.../domain/WidgetCreatedDomainEventMother.ts` | Event mother |
| `test/.../domain/Widget.unit.test.ts` | Updated — `#create` describe block added |

### `update`
| File | Description |
|------|-------------|
| `application/update/WidgetUpdater.ts` | Use case — searches, calls `model.update(params)`, saves, publishes |
| `application/update/UpdateWidgetCommand.ts` | Command DTO |
| `application/update/UpdateWidgetCommandHandler.ts` | Command handler |
| `domain/WidgetUpdatedDomainEvent.ts` | Domain event |
| `domain/Widget.ts` | Updated — `update()` added |
| `di/use-cases/widget/widgetUpdater.dependency.ts` | DI registration |
| `test/.../update/WidgetUpdater.unit.test.ts` | Unit test |
| `test/.../update/UpdateWidgetCommandMother.ts` | Command mother |
| `test/.../update/WidgetUpdaterTestCase.ts` | TestCase |
| `test/.../domain/WidgetUpdatedDomainEventMother.ts` | Event mother |
| `test/.../domain/Widget.unit.test.ts` | Updated — `#update` describe block added |

### `remove`
| File | Description |
|------|-------------|
| `application/remove/WidgetRemover.ts` | Use case — searches, calls `model.remove()`, calls `repo.remove(model)` |
| `application/remove/RemoveWidgetCommand.ts` | Command DTO |
| `application/remove/RemoveWidgetCommandHandler.ts` | Command handler |
| `domain/WidgetRemovedDomainEvent.ts` | Domain event |
| `domain/Widget.ts` | Updated — `remove()` added |
| `domain/repository/WidgetPersistenceRepository.ts` | Updated — `remove(model)` added |
| `infrastructure/persistence/WidgetMongoRepository.ts` | Updated — transactional `remove(model)` with Outbox |
| `di/use-cases/widget/widgetRemover.dependency.ts` | DI registration |
| `test/.../remove/WidgetRemover.unit.test.ts` | Unit test |
| `test/.../remove/RemoveWidgetCommandMother.ts` | Command mother |
| `test/.../remove/WidgetRemoverTestCase.ts` | TestCase |
| `test/.../domain/WidgetRemovedDomainEventMother.ts` | Event mother |
| `test/.../domain/Widget.unit.test.ts` | Updated — `#remove` describe block added |

### `search`
| File | Description |
|------|-------------|
| `application/search/WidgetFinder.ts` | Use case — returns `SearchWidgetResponse` or throws |
| `application/search/SearchWidgetQuery.ts` | Query DTO |
| `application/search/SearchWidgetQueryHandler.ts` | Query handler |
| `application/search/SearchWidgetResponse.ts` | Response DTO |
| `domain/repository/WidgetPersistenceRepository.ts` | Updated — `search()` added |
| `di/use-cases/widget/widgetFinder.dependency.ts` | DI registration |
| `test/.../search/WidgetFinder.unit.test.ts` | Unit test |
| `test/.../search/SearchWidgetResponseMother.ts` | Response mother |
| `test/.../search/WidgetFinderTestCase.ts` | TestCase |

### `matchByCriteria`
| File | Description |
|------|-------------|
| `application/matchByCriteria/WidgetMatcher.ts` | Use case — returns `{ items, total }` always (no exception on empty) |
| `application/matchByCriteria/MatchByCriteriaWidgetQuery.ts` | Query DTO |
| `application/matchByCriteria/MatchByCriteriaWidgetQueryHandler.ts` | Query handler |
| `application/matchByCriteria/MatchByCriteriaWidgetResponse.ts` | Response DTO |
| `domain/repository/WidgetPersistenceRepository.ts` | Updated — `matching()` + `matchingCount()` added |
| `infrastructure/persistence/WidgetMongoRepository.ts` | Updated — `matching()` + `matchingCount()` added |
| `di/use-cases/widget/widgetMatcher.dependency.ts` | DI registration |
| `test/.../matchByCriteria/WidgetMatcher.unit.test.ts` | Unit test |
| `test/.../matchByCriteria/MatchByCriteriaWidgetResponseMother.ts` | Response mother |
| `test/.../matchByCriteria/WidgetMatcherTestCase.ts` | TestCase |
| `test/.../matchByCriteria/WidgetMatchByCriteriaCriteriaMother.ts` | Criteria mother |

---

## Key Patterns to Verify

After generation, confirm:

- Domain events are **flat in `domain/`** — NOT in `domain/domain-event/`
- `static create()` receives `clock: Clock` as second parameter
- `remove()` signature is `remove(model: Widget)` — NOT `remove(id: WidgetId)`
- `MongoRepository.save()` and `remove()` use `withTransaction` + `outbox.save()` — atomicity guaranteed
- `matchByCriteria` always returns `{ items: [], total: 0 }` on empty — never throws

---

## References

- `assets/cli-help.md` — full `--help` output
