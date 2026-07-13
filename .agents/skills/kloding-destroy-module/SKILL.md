---
name: rubricae-destroy-module
description: "Trigger: destroy module, eliminar módulo, rb destroy module, rb d m. Remove a full Rubricae CRUD module — either all 5 controllers or the entire domain + use cases — non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to remove a complete module slice: either the controller slice (`controller`) or the full domain + use-case slice (`domain`). For single-action removals, use `rubricae-destroy-controller` or `rubricae-destroy-use-case` instead.

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d m` command, you MUST ask the user for explicit confirmation. This is non-negotiable. This command is the most destructive in the CLI — it can wipe an entire module slice in one shot.**

Show exactly what will be deleted based on the type:

**For `rb d m controller <app> <Module>`:**
```
I am about to permanently destroy ALL controllers for <app>/<Module>:

  • src/apps/<app>/backend/controllers/<module>/   (all controller files)
  • All matching DI .dependency.ts files
  • All matching .feature acceptance tests
  • Route handlers, OpenAPI operations, appsDependencies.ts entries

This cannot be undone. Type YES to confirm or NO to cancel.
```

**For `rb d m domain <Context> <Module>`:**
```
I am about to permanently destroy the ENTIRE domain slice for <Context>/<Module>:

  • ALL use cases (application/ directories, handlers, commands/queries, domain events)
  • Domain layer (aggregate, VOs, exceptions, repository interface)
  • Infrastructure layer (MongoRepository)
  • All test directories (unit, integration, acceptance features)
  • All DI registrations in <context>Dependencies.ts

This is a FULL MODULE WIPE and cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Two independent slices** — `controller` and `domain` are separate commands; remove `controller` before `domain`.
2. **Context/app casing** — `<Context>` is PascalCase; `<app>` is lowercase.
3. **Module name is PascalCase** — `Widget`, not `widget`.
4. **`domain` cascades automatically** — it calls `rb d uc` for every existing action, then `rb d a`. In non-interactive mode this happens without further confirmation.
5. **`domain` blocks on live controllers or subscribers** — remove them first.
6. **No `auth` argument** — unlike `rb g m controller`, the destroy command takes no auth param.

---

## Command Reference

```bash
# Remove all 5 controllers
rb destroy module controller <app> <Module>
# alias: rb d m controller <app> <Module>

# Remove domain + all use cases (cascade)
rb destroy module domain <Context> <Module>
# alias: rb d m domain <Context> <Module>

# Examples
rb d m controller clitest Widget
rb d m domain Clitest Widget
```

---

## Full teardown workflow

```bash
# Step 1 — subscribers that react to domain events
rb d sub Clitest Widget CreateOperationOnWidgetCreated

# Step 2 — all controllers
rb d m controller clitest Widget

# Step 3 — domain + use cases (cascade)
rb d m domain Clitest Widget

# Step 4 (optional) — acceptance feature dir if it still exists
# The domain destroy removes test/acceptance/features/<module>/ automatically.
```

---

## What Each Type Removes

### `controller`

Iterates every `*Controller.ts` in `src/apps/<app>/backend/controllers/<module>/` and runs `destroyComponent` for each:

- Controller `.ts` file
- DI `.dependency.ts` file
- `.feature` acceptance test
- Route handler from `<module>.route.ts` (file deleted if empty)
- Module import from `routes/index.ts` (if route file was deleted)
- OpenAPI operation from `definition.json`
- `import` + `register` from `appsDependencies.ts`

### `domain`

Runs internally:
1. `rb d uc <Context> <Module> <action>` — for each detected use case action
2. `rb d a <Context> <Module>` — domain files, infrastructure, test directories, DI

Additionally removes:
- `test/acceptance/features/<module>/` — entire acceptance feature directory

---

## Key Patterns to Verify

After destruction, confirm:

- `src/apps/<app>/backend/controllers/<module>/` no longer exists
- `src/Contexts/<Context>/<Module>/` no longer exists (or only has non-generated content)
- `appsDependencies.ts` and `<context>Dependencies.ts` have no orphaned entries for the module
- `definition.json` has no paths containing the module's route segment

---

## References

- `rubricae-destroy-controller` — single controller removal details
- `rubricae-destroy-use-case` — single use case removal details
- `rubricae-destroy-aggregate` — domain layer removal details
- `rubricae-generate-module` — inverse operation reference
