---
name: rubricae-destroy-use-case
description: "Trigger: destroy use case, eliminar caso de uso, rb destroy use-case, rb d uc. Remove a single Rubricae use case action — handler, command/query, domain event, repository methods, and DI — non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to remove a single use case action from a Rubricae domain module. It handles repository method cleanup, domain aggregate patching, domain event removal, and DI deregistration automatically.

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d uc` command, you MUST ask the user for explicit confirmation. This is non-negotiable.**

Show exactly what will be deleted:

```
I am about to permanently destroy the <action> use case for <Context>/<Module>:

  • src/Contexts/<Context>/<Module>/application/<action>/   (use case, command/query, handler)
  • test/unit-integration/.../<action>/                    (unit test, mother, TestCase)
  • Domain event file (create/update/remove actions only)
  • Aggregate <Module>.ts — static method for this action removed
  • Repository interface + MongoRepository — method removed if no other use case needs it
  • dependency-injection/use-cases/<module>/...dependency.ts — deleted
  • <context>Dependencies.ts — import and register call removed

This cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Destroy the controller first** — if a controller for this action still exists, the CLI exits with code 1 in non-interactive mode. Run `rb d c <app> <Module> <action>` first.
2. **Destroy subscribers first** — subscribers that reference the use case's DI key (`<Context>.<Module>.<Actor>`) also block removal. Run `rb d sub` first.
3. **PascalCase for context and module** — `Clitest`, `Widget`.
4. **Always non-interactive** — pass all 3 positional args to skip prompts.
5. **Repository method cleanup is smart** — `save` is only removed when no other use case remains; `search` is only removed when no write use case remains.

---

## Command Reference

```bash
rb destroy use-case <Context> <Module> <action>
# alias: rb d uc <Context> <Module> <action>

# actions: create | update | remove | search | matchByCriteria

# Example
rb d uc Clitest Widget create
```

---

## Dependency Guard

```
1. rb d c <app> <Module> <action>     # remove the controller for this action first
2. rb d sub <Context> <Module> <Sub>  # remove subscribers that depend on the use case DI key
3. rb d uc <Context> <Module> <action>  # safe to destroy the use case now
```

---

## What Gets Removed

### Application directories (deleted entirely)

| Path | Notes |
|------|-------|
| `src/Contexts/<Context>/<Module>/application/<action>/` | Use case class, command/query DTO, handler |
| `test/unit-integration/.../application/<action>/` | Unit test, command/query mother, TestCase |

### Domain event (command actions only)

| Action | Domain event removed |
|--------|----------------------|
| `create` | `<Module>CreatedDomainEvent.ts` + mother |
| `update` | `<Module>UpdatedDomainEvent.ts` + mother |
| `remove` | `<Module>RemovedDomainEvent.ts` + mother |

### Aggregate patched

| Action | Method removed from `<Module>.ts` |
|--------|-----------------------------------|
| `create` | `static create()` + Clock import |
| `update` | `update()` |
| `remove` | `remove()` |

Domain unit test `<Module>.unit.test.ts` — the `describe('#<action>')` block is removed.

### Repository files patched

| Action | Method removed |
|--------|----------------|
| `create` | `save()` — only if no other use case remains |
| `update` | `save()` — only if no other use case remains |
| `remove` | `remove()` |
| `search` | `search()` — only if no write use case remains |
| `matchByCriteria` | `matching()` + `matchingCount()` + Criteria import |

Repository integration test `<Module>PersistenceRepository.integration.test.ts` — the matching `describe` block removed. File and TestCase deleted if empty.

### DI registration cleaned

- `src/apps/<context>/backend/config/dependency-injection/use-cases/<module>/<module><Actor>.dependency.ts` — deleted
- `<context>Dependencies.ts` — `import` + `register<Module><Actor>(container)` lines removed

---

## Key Patterns to Verify

After destruction, confirm:

- No `<Module>Creator` / `<Module>Updater` / `<Module>Remover` / `<Module>Finder` / `<Module>Matcher` classes remain for the removed action
- `<context>Dependencies.ts` has no orphaned import or register call
- Aggregate `<Module>.ts` no longer has the removed static method
- Domain event file is gone for command actions

---

## References

- `rubricae-destroy-controller` — must run before use case destroy
- `rubricae-destroy-subscriber` — must run before use case destroy
- `rubricae-destroy-aggregate` — run after all use cases are removed to wipe the domain layer
- `rubricae-generate-use-case` — inverse operation reference
