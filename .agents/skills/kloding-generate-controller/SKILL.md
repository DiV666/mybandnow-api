---
name: rubricae-generate-controller
description: "Trigger: create controller, generate controller, nuevo controlador, rb generate controller, rb g c. Generate Rubricae HTTP controllers, DI wiring, and acceptance tests non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.1"
---

## Activation Contract

Use this skill when asked to generate a controller or a full controller module for a Rubricae app.

---

## Hard Rules

1. **Use case must exist first** — `rb g uc` before `rb g c`. The CLI validates the use case exists.
2. **Always non-interactive** — pass all 4 positional args; the CLI prompts if any is missing.
3. **App name is lowercase** — `clitest`, not `Clitest`.
4. **Module name is PascalCase** — `Widget`, not `widget`.
5. **`rb g m controller` generates all 5 actions at once** — asks auth once and applies it to all.
6. **Controller imports use `@Contexts/` alias** — NOT relative `../../../../../Contexts/`.
7. **Auth is required** — always pass arg 4 non-interactively; omitting it triggers the interactive prompt.

---

## Command Reference

```bash
# Single controller
rb generate controller <app> <Module> <action> <auth>
# alias: rb g c <app> <Module> <action> <auth>

# actions:  create | update | remove | search | matchByCriteria
# auth:     none | internal | bearer | bearer:<roles>
#   bearer              → any valid JWT token
#   bearer:admin        → JWT with role "admin"
#   bearer:admin,teacher → JWT with role "admin" OR "teacher"
#   internal            → x-internal-auth header
#   none                → no authentication

# Full CRUD controllers (all 5 at once — asks auth once)
rb generate module controller <app> <Module>
# alias: rb g m controller <app> <Module>
```

---

## What Gets Generated

Each `rb g c` call produces **3 artifacts**:

| File | Description |
|------|-------------|
| `src/apps/<app>/backend/controllers/<module>/<Module><Verb><Suffix>Controller.ts` | HTTP controller |
| `src/apps/<app>/backend/config/dependency-injection/controllers/<module>/<module><Verb><Suffix>.dependency.ts` | DI registration |
| `test/acceptance/features/<module>/<module><Suffix>.feature` | Cucumber acceptance test |

Plus it updates:
- `src/apps/<app>/backend/routes/<module>.route.ts` — adds the route handler export
- `src/apps/<app>/backend/routes/index.ts` — adds the module import
- `src/apps/<app>/backend/config/swagger/definition.json` — adds the OpenAPI operation
- `src/apps/<app>/backend/config/dependency-injection/dependencies/appsDependencies.ts` — registers the controller

### Controller naming

| Action | Class name | File name |
|--------|-----------|-----------|
| `create` | `WidgetPostCreateController` | `WidgetPostCreateController.ts` |
| `update` | `WidgetPutUpdateController` | `WidgetPutUpdateController.ts` |
| `remove` | `WidgetDeleteRemoveController` | `WidgetDeleteRemoveController.ts` |
| `search` | `WidgetGetSearchController` | `WidgetGetSearchController.ts` |
| `matchByCriteria` | `WidgetGetMatchByCriteriaController` | `WidgetGetMatchByCriteriaController.ts` |

---

## Authentication

Auth is set per-endpoint in `definition.json` via the OpenAPI `security` block.

| `<auth>` value | `security` block in definition.json |
|----------------|--------------------------------------|
| `none` | `"security": []` |
| `bearer` | `"security": [{ "BearerAuth": [] }]` |
| `bearer:admin` | `"security": [{ "BearerAuth": ["admin"] }]` |
| `bearer:admin,teacher` | `"security": [{ "BearerAuth": ["admin", "teacher"] }]` |
| `internal` | `"security": [{ "InternalAuth": [] }]` |

Roles are validated at runtime by Keycloak (`BearerAuth`) or the internal auth header (`InternalAuth`).
The security schemes `BearerAuth` and `InternalAuth` are defined in `definition.json` under `components.securitySchemes`.

---

## HTTP status codes

| Action | Success code | Exception → code |
|--------|-------------|-----------------|
| `create` | `201 Created` | `ExistException` → `409 Conflict` |
| `update` | `200 OK` | `NotExistException` → `404 Not Found` |
| `remove` | `204 No Content` | `NotExistException` → `404 Not Found` |
| `search` | `200 OK` (via `res.send`) | `NotExistException` → `404 Not Found` |
| `matchByCriteria` | `200 OK` (via `res.send`) | none — always returns `{ items, total }` |

---

## DI wiring pattern

```typescript
// create / update / remove — CommandBus, no QueryBus
container
  .register('Apps.Clitest.Backend.controllers.WidgetPostCreateController', WidgetPostCreateController)
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addArgument(new Reference('Shared.CommandBus'))
  .addArgument(null)                    // QueryBus = null for commands
  .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));

// search / matchByCriteria — QueryBus, no CommandBus
container
  .register('Apps.Clitest.Backend.controllers.WidgetGetSearchController', WidgetGetSearchController)
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addArgument(null)                    // CommandBus = null for queries
  .addArgument(new Reference('Shared.QueryBus'))
  .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
```

---

## Acceptance test structure

Each feature follows Gherkin with `Given`/`And` for setup and `When`/`Then` for actions:

```gherkin
@widget
Feature: Create a new widget

  Background:
    Given An authenticated user "test" with password "asdASD123"
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: A valid unexisting widget is created
    When I send a POST request to "/v1/widgets" with body:
      """
      { "id": "#id" }
      """
    Then the response status code should be 201
```

---

## References

- `assets/cli-help.md` — full `--help` output for controller and module commands
