---
name: rubricae-destroy-controller
description: "Trigger: destroy controller, eliminar controlador, rb destroy controller, rb d c. Remove a single Rubricae HTTP controller, its DI wiring, acceptance test, and Swagger operation non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to remove a single controller action from a Rubricae app — or when preparing to destroy a use case that still has a controller attached.

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d c` command, you MUST ask the user for explicit confirmation. This is non-negotiable.**

Show exactly what will be deleted:

```
I am about to permanently destroy the <action> controller for <app>/<Module>:

  • src/apps/<app>/backend/controllers/<module>/<Module><Verb><Suffix>Controller.ts
  • src/apps/<app>/backend/config/dependency-injection/controllers/<module>/...dependency.ts
  • test/acceptance/features/<module>/<module><Suffix>.feature
  • <module>.route.ts — route handler removed (file deleted if empty)
  • definition.json — OpenAPI operation removed
  • appsDependencies.ts — import and register call removed

This cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Always non-interactive** — pass all 3 positional args; the CLI prompts if any is missing.
2. **App name is lowercase** — `clitest`, not `Clitest`.
3. **Module name is PascalCase** — `Widget`, not `widget`.
4. **`action` must match exactly** — `create | update | remove | search | matchByCriteria`.
5. **Alias `delete` → `remove`** — the CLI normalises `delete` to `remove` automatically.
6. **To remove all 5 controllers at once**, use `rb d m controller` instead (see `rubricae-destroy-module`).

---

## Command Reference

```bash
rb destroy controller <app> <Module> <action>
# alias: rb d c <app> <Module> <action>

# actions: create | update | remove | search | matchByCriteria

# Example
rb d c clitest Widget remove
```

---

## What Gets Removed

| Artifact | Path |
|----------|------|
| Controller file | `src/apps/<app>/backend/controllers/<module>/<Module><Verb><Suffix>Controller.ts` |
| DI registration | `src/apps/<app>/backend/config/dependency-injection/controllers/<module>/<module><Verb><Suffix>.dependency.ts` |
| Acceptance test | `test/acceptance/features/<module>/<module><Suffix>.feature` |

Plus these shared files are **patched** (not deleted unless empty after the change):

| File | Change |
|------|--------|
| `src/apps/<app>/backend/routes/<module>.route.ts` | Route handler function removed; file deleted if empty |
| `src/apps/<app>/backend/routes/index.ts` | Module import removed if route file was deleted |
| `src/apps/<app>/backend/config/swagger/definition.json` | OpenAPI operation removed; path entry deleted if no methods remain |
| `src/apps/<app>/backend/config/dependency-injection/dependencies/appsDependencies.ts` | `import` + `register` call removed |

Empty parent directories are pruned automatically after removal.

---

## Action → HTTP method mapping

| Action | HTTP verb | Path |
|--------|-----------|------|
| `create` | `POST` | `/v1/<modules>` |
| `update` | `PUT` | `/v1/<modules>/{id}` |
| `remove` | `DELETE` | `/v1/<modules>/{id}` |
| `search` | `GET` | `/v1/<modules>/{id}` |
| `matchByCriteria` | `GET` | `/v1/<modules>` |

---

## Key Patterns to Verify

After destruction, confirm:

- Controller `.ts` file no longer exists
- `definition.json` no longer has the HTTP operation for that path/method
- `appsDependencies.ts` has no orphaned `import` or `register` line for the deleted controller

---

## References

- `rubricae-destroy-module` — removes all 5 controllers at once
- `rubricae-generate-controller` — inverse operation reference
