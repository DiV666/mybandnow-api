---
name: rubricae-destroy-aggregate
description: "Trigger: destroy aggregate, eliminar dominio, rb destroy aggregate, rb d a. Remove a Rubricae domain layer (aggregate, VOs, exceptions, repository, infrastructure) non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to remove a domain module (aggregate + value objects + exceptions + repository interface + MongoRepository) from a Rubricae project.

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d a` command, you MUST ask the user for explicit confirmation. This is non-negotiable.**

Show exactly what will be deleted:

```
I am about to permanently destroy the domain layer for <Context>/<Module>:

  • src/Contexts/<Context>/<Module>/domain/           (aggregate, VOs, exceptions, repository interface)
  • src/Contexts/<Context>/<Module>/infrastructure/   (MongoRepository)
  • test/unit-integration/Contexts/<Context>/<Module>/domain/  (mothers, unit test)
  • <context>Dependencies.ts — registration entries removed
  (+ all dependent use cases will cascade automatically)

This cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Destroy controllers and subscribers first** — `rb d a` blocks if controllers or subscribers that import domain events still exist. Remove them first with `rb d m controller` or `rb d sub`.
2. **Cascade on use cases** — in non-interactive mode, all dependent use cases are destroyed automatically before the domain is deleted.
3. **PascalCase for context and module** — `Clitest`, `Widget`.
4. **Run from the project root** — the CLI resolves paths relative to `process.cwd()`.
5. **Interactive mode asks for cascade confirmation** — always pass all positional args to skip prompts.

---

## Command Reference

```bash
rb destroy aggregate <Context> <Module>
# alias: rb d a <Context> <Module>

# Example
rb d a Clitest Widget
```

---

## Dependency Guard — Order of Destruction

```
1. rb d m controller <app> <Module>         # remove all controllers first
2. rb d sub <Context> <Module> <Subscriber> # remove all subscribers that import domain events
3. rb d a <Context> <Module>                # safe to destroy domain now
```

In non-interactive mode, step 3 automatically cascades through use cases before removing domain files. If controllers or subscribers still exist, the command exits with code 1.

---

## What Gets Removed

```
src/Contexts/<Context>/<Module>/
├── domain/
│   ├── <Module>.ts                         # aggregate
│   ├── value-object/
│   │   ├── <Module>Id.ts
│   │   ├── <Module>CreatedAt.ts
│   │   └── <Module><ParamName>.ts          # one per rb g p call
│   ├── exception/
│   │   ├── <Module>ExistException.ts
│   │   └── <Module>NotExistException.ts
│   └── repository/
│       └── <Module>PersistenceRepository.ts
└── infrastructure/
    └── persistence/
        └── <Module>MongoRepository.ts      # entire dir removed

test/unit-integration/Contexts/<Context>/<Module>/domain/
├── <Module>Mother.ts
├── <Module>IdMother.ts
├── <Module>CreatedAtMother.ts
├── <Module>.unit.test.ts
└── <Module><ParamName>Mother.ts            # one per parameter

src/apps/<context>/backend/config/dependency-injection/dependencies/
└── <context>Dependencies.ts               # import + register lines cleaned
```

Plus: empty parent directories are pruned automatically.

**Note**: use-case application directories and test acceptance features are removed in cascade by `destroyUseCase` before the domain files are touched.

---

## Key Patterns to Verify

After destruction, confirm:

- No `import { <Module>... }` remains in any controller or subscriber
- `<context>Dependencies.ts` no longer references `<Module>MongoRepository`
- `domain/`, `infrastructure/`, and test directories for the module are gone

---

## References

- `rubricae-destroy-use-case` — cascade step run before domain removal
- `rubricae-destroy-controller` — must run before aggregate destroy
- `rubricae-destroy-subscriber` — must run before aggregate destroy
