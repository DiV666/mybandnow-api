---
name: rubricae-destroy-parameter
description: "Trigger: destroy parameter, eliminar parámetro, rb destroy parameter, rb d p, destroy global-parameter, global-parameter, rb destroy global-parameter, rb d gp. Remove a domain or controller parameter from a Rubricae module non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to remove a field, property, or parameter from an existing Rubricae domain module or controller. It covers both `destroy parameter` (targeted) and `destroy global-parameter` (domain + controller in one step).

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d p` or `rb d gp` command, you MUST ask the user for explicit confirmation. This is non-negotiable.**

Show exactly what will be patched or deleted:

```
I am about to permanently remove the parameter "<name>" from <Context>/<Module>:

  • domain/value-object/<Module><Name>.ts — deleted
  • <Module>.ts — field removed from Primitives, constructor, fromPrimitives, toPrimitives, create()
  • Domain events (Created/Updated/Removed) — field removed from attributes
  • Application commands and use cases — param removed from run() and Command
  • Test mothers — field removed or mother file deleted

(For rb d gp: also patches controller body/query schema and definition.json)

This cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Always non-interactive** — pass all positional args; the CLI prompts if any is missing.
2. **camelCase for parameter name** — `apiUrl`, `statusType`, not `ApiUrl` or `api_url`.
3. **PascalCase for context and module** — `Configs`, `Communicator`.
4. **Aggregate must exist** — the CLI will fail silently if the domain files are missing.
5. **`global-parameter` removes domain VO + controller field in one step** — use it when the parameter spans both layers.
6. **`destroy parameter aggregate` does NOT touch controller schemas** — run `destroy parameter controller` separately if the field was also in the controller.

---

## Command Reference

### Domain parameter (VO only)

```bash
rb destroy parameter aggregate <Context> <Module> <name>
# alias: rb d p aggregate <Context> <Module> <name>

# Example
rb d p aggregate Configs Communicator apiUrl
```

### Controller parameter (Swagger + controller body/query only)

```bash
rb destroy parameter controller <app> <Module> <action> <name>
# alias: rb d p controller <app> <Module> <action> <name>

# action: create | update

# Example
rb d p controller configs Communicator create apiUrl
```

### Global parameter (domain VO + controller — one step)

```bash
rb destroy global-parameter <Context> <Module> <name>
# alias: rb d gp <Context> <Module> <name>

# Example
rb d gp Configs Communicator apiUrl
```

---

## What Each Command Touches

### `rb d p aggregate` removes / patches:

| File | Change |
|------|--------|
| `domain/value-object/<Module><Name>.ts` | **Deleted** |
| `domain/<Module>.ts` | Field removed from `Primitives`, constructor, `fromPrimitives`, `toPrimitives`, `create()` params |
| `domain/<Module>CreatedDomainEvent.ts` | Field removed from attributes type |
| `domain/<Module>UpdatedDomainEvent.ts` | Field removed from attributes type |
| `domain/<Module>RemovedDomainEvent.ts` | Field removed from attributes type |
| `application/create/<Module>Creator.ts` | Param removed from `run()` and `create()` call |
| `application/create/Create<Module>Command.ts` | `readonly <name>` property removed |
| `application/update/<Module>Updater.ts` | Param removed from `run()` and `params` object |
| `application/update/Update<Module>Command.ts` | `readonly <name>` property removed |
| `test/.../domain/<Module>Mother.ts` | Field removed |
| `test/.../domain/<Module><Name>Mother.ts` | **Deleted** |
| `test/.../create/Create<Module>CommandMother.ts` | Field removed |
| `test/.../domain/<Module>.unit.test.ts` | Param removed from `create()` call in `#create` test |

### `rb d p controller` patches:

| File | Change |
|------|--------|
| `apps/.../controllers/<module>/<Controller>.ts` | Param extraction line removed |
| `apps/.../config/swagger/definition.json` | Property removed from request schema |

### `rb d gp` runs:

1. `rb d p aggregate <Context> <Module> <name>`
2. `rb d p controller <app> <Module> create <name>`
3. `rb d p controller <app> <Module> update <name>` (if update use case exists)

---

## Key Patterns to Verify

After destruction, confirm:

- VO file `<Module><Name>.ts` no longer exists
- `Primitives` type in `<Module>.ts` no longer includes the field
- `definition.json` no longer lists the property in the request schema
- `Create<Module>Command.ts` and `Update<Module>Command.ts` no longer declare the `readonly` property
- Mother files no longer generate a value for the removed field

---

## References

- `rubricae-generate-parameter` — inverse operation reference
- `rubricae-destroy-aggregate` — use when removing all parameters + domain
