---
name: rubricae-generate-aggregate
description: "Trigger: create aggregate, generate aggregate, nuevo agregado, rb generate aggregate, rb g a. Generate a Rubricae domain module using rubricae-cli non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to create or generate a domain aggregate module in a rubricae-based project.

---

## Hard Rules

1. **Always run non-interactively** — pass all arguments positionally, never rely on prompts.
2. **PascalCase for context and module names** — `Configs`, `Communicator`, not `configs` or `communicator`.
3. **Run from the project root** — the CLI resolves paths relative to `process.cwd()`.
4. **Add parameters immediately after aggregate generation** — do not generate use cases first.
5. **If the CLI fails or hangs**, check the help output in `assets/cli-help.md` and verify argument order.

---

## Command Reference

```bash
# 1. Generate the aggregate skeleton
rb generate aggregate <Context> <Module>
# alias: rb g a <Context> <Module>

# 2. Add each domain parameter (repeat per field)
rb generate parameter aggregate <Context> <Module> <paramName> <type> <nullable>
# alias: rb g p aggregate <Context> <Module> <paramName> <type> <nullable>

# Parameter types:  string | number | uuid | boolean | date | enum
# nullable:         true | false
```

### Full example — `Configs` context, `Communicator` module

```bash
# Step 1 — aggregate skeleton
rb g a Configs Communicator

# Step 2 — add fields
rb g p aggregate Configs Communicator name    string  false
rb g p aggregate Configs Communicator type    enum    false
rb g p aggregate Configs Communicator apiUrl  uri     false
rb g p aggregate Configs Communicator token   string  true
```

---

## What Gets Generated

```
src/Contexts/<Context>/<Module>/
└── domain/
    ├── <Module>.ts                        # Aggregate (fromPrimitives, toPrimitives)
    ├── <Module>CreatedDomainEvent.ts      # flat — NOT in domain-event/ subdirectory
    ├── <Module>UpdatedDomainEvent.ts
    ├── <Module>RemovedDomainEvent.ts
    ├── exception/
    │   ├── <Module>ExistException.ts
    │   └── <Module>NotExistException.ts
    ├── repository/
    │   └── <Module>PersistenceRepository.ts
    └── value-object/
        ├── <Module>Id.ts
        ├── <Module>CreatedAt.ts
        └── <Module><ParamName>.ts         # one per rb g p call

test/unit-integration/Contexts/<Context>/<Module>/domain/
    ├── <Module>Mother.ts
    ├── <Module>IdMother.ts
    ├── <Module>CreatedAtMother.ts
    └── <Module><ParamName>Mother.ts       # one per rb g p call
```

Domain events are generated **only when use cases are added** (`rb g uc`).

---

## Key Patterns to Verify

After generation, confirm:

- `<Module>CreatedAt extends DateValueObject` — NOT `StringValueObject`
- Domain events are flat in `domain/` — NOT in `domain/domain-event/`
- All imports use `@Contexts/` and `@Test/` aliases — NOT relative `../../../` paths
- `static create()` receives `clock: Clock` as second parameter (added when `rb g uc` create runs)

See `assets/expected-output.md` for annotated file examples.

---

## References

- `assets/cli-help.md` — full `--help` output for every relevant command
- `assets/expected-output.md` — annotated examples of generated files
