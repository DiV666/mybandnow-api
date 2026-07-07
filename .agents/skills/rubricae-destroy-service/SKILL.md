---
name: rubricae-destroy-service
description: "Trigger: destroy service, eliminar servicio, rb destroy service, rb d s. Remove a Rubricae shared HTTP infrastructure service and all its domain adapters. Supports both interactive (no args) and non-interactive (positional args) modes."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.1"
---

## Activation Contract

Use this skill when asked to remove a shared infrastructure service (HTTP client layer) and its associated context adapters from a Rubricae project.

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d s` command, you MUST ask the user for explicit confirmation. This is non-negotiable.**

Show exactly what will be deleted:

```
I am about to permanently destroy the service <Service> and all its domain adapters:

  • src/Contexts/Shared/infrastructure/Http/<Service>/     (Config, ClientFactory, Repository, Exceptions)
  • src/Contexts/<Context>/Shared/infrastructure/Http/<Service>/  (ConfigFactory)
  • test/unit-integration/Contexts/Shared/infrastructure/Http/<Service>/
  • Per-module adapters (for each bound module):
      - src/Contexts/<Context>/<Module>/domain/<Module>CommunicationsRepository.ts
      - src/Contexts/<Context>/<Module>/infrastructure/http/Http<Module>CommunicationsRepository.ts
      - dependency-injection/infrastructure/<module>/...dependency.ts
  • appsDependencies.ts — ConfigFactory and adapter registrations removed

This cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Non-interactive supported** — pass `<Context>` and `<Service>` positionally to skip all prompts.
2. **Hard guard on use case dependencies** — if any use case DI file depends on the service's `CommunicationsRepository` key, the command **aborts with exit code 1 without deleting anything**.
3. **Service name resolved to PascalCase** — any case input is normalized (e.g. `notifier` → `Notifier`).
4. **Service must exist** — non-interactive mode exits immediately with an error if the service directory is not found.
5. **All generated artifacts are removed** — layer 1, step 2 (ConfigFactory), step 3 (integration test), and per-module adapters (layers 2 & 3 + DI) are all deleted automatically.

---

## Command Reference

```bash
# Non-interactive (no prompts)
rb destroy service <Context> <Service>
rb d s <Context> <Service>

# Examples
rb d s Clitest Notifier
rb d s Clitest notifier    # case-normalized: Notifier

# Interactive (prompts for service selection and confirmation)
rb destroy service
rb d s
```

---

## Guard Behaviour

Before deleting anything, the CLI scans all use-case DI files (`dependency-injection/use-cases/**/*.ts`) for references to any `CommunicationsRepository` key that is backed by the service being destroyed.

**If dependent use cases are found:**
```
⛔ No se puede eliminar el servicio "Notifier": los siguientes casos de uso dependen de él:
   - src/apps/clitest/backend/config/dependency-injection/use-cases/sms/smsSender.dependency.ts
   Elimina o desconecta esos casos de uso primero.
```
The command exits with code 1. **Nothing is deleted.**

**If no dependent use cases are found:** proceeds to delete all artifacts.

---

## What Gets Deleted

### Layer 1 — Shared HTTP client (step 1 of `rb g s`)

| Path | Notes |
|------|-------|
| `src/Contexts/Shared/infrastructure/Http/<Service>/` | Entire directory: `<Service>Config.ts`, `<Service>ClientFactory.ts`, `<Service>Repository.ts`, `<Service>Exception.ts`, `<Service>NotExistException.ts` |

### Step 2 — Context-specific ConfigFactory

| Path | Notes |
|------|-------|
| `src/Contexts/<Context>/Shared/infrastructure/Http/<Service>/` | Entire directory: `<Service>ConfigFactory.ts` |

### Step 3 — Integration test

| Path | Notes |
|------|-------|
| `test/unit-integration/Contexts/Shared/infrastructure/Http/<Service>/` | Integration test directory for the shared layer |

### Per-module adapters (if bound via `rb g s ... <modules>`)

| Path | Notes |
|------|-------|
| `src/Contexts/<Context>/<Module>/domain/<Module>CommunicationsRepository.ts` | Domain port (layer 3) |
| `src/Contexts/<Context>/<Module>/infrastructure/http/Http<Module>CommunicationsRepository.ts` | HTTP adapter (layer 2) |
| `src/apps/<context>/backend/config/dependency-injection/infrastructure/<module>/<module>CommunicationsRepository.dependency.ts` | Adapter DI file |

### DI cleaned (per context app)

| File | Change |
|------|--------|
| `src/apps/<context>/backend/config/dependency-injection/dependencies/appsDependencies.ts` | `import { <Service>ConfigFactory }` + `container.register('Apps.<Context>.Backend.<Service>Config')` block removed; also removes `register<Module>CommunicationsRepository` import and call for each bound module |

Empty parent directories are pruned after deletion.

---

## Key Patterns to Verify

After destruction, confirm:

- `src/Contexts/Shared/infrastructure/Http/<Service>/` no longer exists
- `src/Contexts/<Context>/Shared/infrastructure/Http/<Service>/` no longer exists
- `test/unit-integration/Contexts/Shared/infrastructure/Http/<Service>/` no longer exists
- `appsDependencies.ts` has no `<Service>ConfigFactory` reference and no `register<Module>CommunicationsRepository` calls
- No remaining `*CommunicationsRepository.ts` files tied to this service

---

## References

- `rubricae-generate-service` — inverse operation reference
