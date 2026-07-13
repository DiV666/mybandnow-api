---
name: rubricae-generate-module
description: "Trigger: create module, generate module, nuevo módulo, CRUD completo, rb generate module, rb g m. Generate a full Rubricae CRUD module — domain + use cases, or all 5 controllers — non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to generate a complete CRUD module — either the domain+use-case slice (`domain`) or the controller slice (`controller`).

---

## Hard Rules

1. **Two independent slices** — `domain` and `controller` are separate commands; run `domain` first.
2. **Context name is PascalCase** — `Clitest`, `Configs`.
3. **App name is lowercase** — `clitest`, `configs` (for `controller` type).
4. **Module name is PascalCase** — `Product`, `Widget`.
5. **`domain` generates domain + all 5 use cases** — equivalent to `rb g a` + 5× `rb g uc`.
6. **`controller` generates all 5 controllers** — equivalent to 5× `rb g c`; requires use cases to exist.
7. **Auth is required for `controller` in non-interactive mode** — always pass arg 4.
8. **Add domain parameters before generating use cases** — `rb g gp` / `rb g f` first, then `rb g m context`.

---

## Command Reference

```bash
# Domain + all 5 use cases
rb generate module domain <Context> <Module>
# alias: rb g m domain <Context> <Module>

# All 5 controllers (requires use cases to exist)
rb generate module controller <app> <Module> <auth>
# alias: rb g m controller <app> <Module> <auth>

# auth: none | internal | bearer | bearer:<roles>
```

---

## What each type generates

### `domain` — domain + use cases

Runs internally:
1. `rb g a <Context> <Module>` — domain skeleton
2. `rb g uc <Context> <Module> create`
3. `rb g uc <Context> <Module> update`
4. `rb g uc <Context> <Module> remove`
5. `rb g uc <Context> <Module> search`
6. `rb g uc <Context> <Module> matchByCriteria`

Everything those commands generate is created: aggregate, VOs, exceptions, repository interface + MongoRepository, all 5 use cases + commands/queries + handlers, domain events, unit tests, integration tests, DI registrations.

### `controller` — all 5 HTTP controllers

Runs internally: 5× `rb g c <app> <Module> <action> <auth>`

For each action (`create`, `update`, `remove`, `search`, `matchByCriteria`):
- `src/apps/<app>/backend/controllers/<module>/<Module><Verb><Suffix>Controller.ts`
- `src/apps/<app>/backend/config/dependency-injection/controllers/<module>/<module><Verb><Suffix>.dependency.ts`
- `test/acceptance/features/<module>/<module><Suffix>.feature`
- Updates routes, Swagger definition, appsDependencies.ts

---

## Full CRUD workflow

```bash
# Step 1 — domain + use cases
rb g m domain Clitest Product

# Step 2 (optional) — add domain parameters before controllers
rb g gp Clitest Product name   string false
rb g gp Clitest Product price  number false
rb g gp Clitest Product active boolean true

# Step 3 — controllers
rb g m controller clitest Product bearer

# Step 4 (optional) — subscriber reacting to product events
rb g sub Clitest Product CreateOperationOnProductCreated \
  rubricae-clitest-1-command-product-created create
```

---

## Auth modes for `controller`

| Arg | OpenAPI `security` block |
|-----|--------------------------|
| `none` | `"security": []` |
| `bearer` | `"security": [{ "BearerAuth": [] }]` |
| `bearer:admin` | `"security": [{ "BearerAuth": ["admin"] }]` |
| `bearer:admin,teacher` | `"security": [{ "BearerAuth": ["admin","teacher"] }]` |
| `internal` | `"security": [{ "InternalAuth": [] }]` |

Auth is applied identically to all 5 controllers in the module. To use different auth per action, use individual `rb g c` calls instead.

---

## References

- `assets/cli-help.md` — full `--help` output and common patterns
- Skills for individual components:
  - `rubricae-generate-domain` — domain skeleton details
  - `rubricae-generate-use-case` — use case details and what each action generates
  - `rubricae-generate-controller` — controller details, DI pattern, acceptance test structure
  - `rubricae-generate-parameter` — adding fields to the module
