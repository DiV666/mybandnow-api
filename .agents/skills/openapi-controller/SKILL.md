---
name: openapi-controller
description: >
  HTTP adapter layer: OpenAPI definition, Express controller, DI wiring, and route registration.
  Trigger: When creating or modifying a controller, adding a new HTTP endpoint, or updating definition.json.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Adding a new HTTP endpoint'
    - 'Creating API endpoints'
    - 'Creating or modifying a controller'
    - 'Testing Apps layer controllers'
---

## Activation Contract

Use this skill when creating the HTTP adapter for an existing use case.
The use case MUST already exist (created via `hexagonal-feature` skill) before building the controller.
Do NOT put business logic in controllers — they only dispatch commands/queries and map exceptions.

## Hard Rules (NEVER Break)

- **operationId coupling**: The `operationId` in `definition.json` MUST exactly match the exported async function name in the corresponding `<module>.route.ts`.
- **definition.json first**: ALWAYS define the OpenAPI operation before writing the controller.
- **Path params from context**: Use `context.request.params.id` — NEVER `req.params.id`.
- **No logic in controllers**: Controllers only call `this.commandBus.dispatch()` or `this.queryBus.ask()`. Zero business logic.
- **All exceptions mapped**: Every domain exception that the use case can throw MUST appear in `exceptions()` with the correct HTTP status.
- **additionalProperties: false**: ALL request body schemas in `definition.json` MUST include `"additionalProperties": false`.
- **Acceptance test required**: Every new endpoint needs a `.feature` file and scenarios covering at least the happy path and one error path.

## Decision Gates

| Situation                                | Action                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Write operation (create, update, delete) | Dispatch a Command; respond with `201`, `200`, or `204`                   |
| Read operation (search, get by id)       | Ask a Query; respond with `200` and a response body                       |
| Use case throws a domain exception       | Add it to `exceptions()`: `{ EntityExistException: httpStatus.CONFLICT }` |
| Path has an `{id}` parameter             | Add `parameters` array in definition.json with `$ref: UUID` schema        |
| Request body has coupled optional fields | Use a discriminated union schema or `oneOf` in definition.json            |

## Execution Steps

### 1 — Add operation to `definition.json`

```json
{
  "/v1/entities/{id}": {
    "put": {
      "operationId": "entityPutUpdate",
      "tags": ["Entity"],
      "summary": "Update an existing entity",
      "security": [],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": { "$ref": "#/components/schemas/UUID" }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/EntityUpdateRequest" }
          }
        }
      },
      "responses": {
        "200": { "description": "The entity has been updated" },
        "400": { "$ref": "#/components/responses/BadRequest" },
        "404": { "$ref": "#/components/responses/NotFound" },
        "500": { "$ref": "#/components/responses/Unknown" }
      }
    }
  }
}
```

Add any new schema to `components.schemas` with `"additionalProperties": false`.

### 2 — Create the controller (`apps/communicator/backend/controllers/<module>/`)

```typescript
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { EntityUpdateCommand } from '../../../../../Contexts/Mybandnow/Entity/application/update/EntityUpdateCommand.js';
import ApiController from '../../../../../Contexts/Shared/infrastructure/Express/ApiController.js';

export default class EntityPutUpdateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const id = context.request.params.id as string; // ← always context.request.params
    const command = new EntityUpdateCommand(id, req.body);
    await this.commandBus.dispatch(command);
    res.status(httpStatus.OK).end();
  }

  exceptions(): Record<string, number> {
    return {
      EntityNotFoundException: httpStatus.NOT_FOUND // class name as string key
    };
  }
}
```

For **query controllers**, use `this.queryBus.ask()` and return a body:

```typescript
const response = await this.queryBus.ask(new SmsSearchQuery(id));
res.status(httpStatus.OK).json(response);
```

### 3 — Create the DI file (`config/dependency-injection/controllers/<module>/entityPutUpdate.dependency.ts`)

```typescript
import { ContainerBuilder, Reference } from 'node-dependency-injection';
import EntityPutUpdateController from '../../../../controllers/<module>/EntityPutUpdateController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.EntityPutUpdateController', EntityPutUpdateController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(null)
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
```

### 4 — Export the route handler (`apps/communicator/backend/routes/<module>.route.ts`)

The exported function name MUST match `operationId` in `definition.json`.

```typescript
export async function entityPutUpdate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.EntityPutUpdateController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}
```

The `routes/index.ts` spreads the module routes automatically — no change needed there.

### 5 — Register controller in `appsDependencies.ts`

```typescript
import { register as registerEntityPutUpdateController } from '../controllers/<module>/entityPutUpdate.dependency.js';

// inside registerAppsDependencies():
registerEntityPutUpdateController(container);
```

### 6 — Write acceptance test (`test/acceptance/features/<module>/entityUpdate.feature`)

```gherkin
@entity
Feature: Update an existing entity

  Background:
    Given An authenticated user "test" with password "asdASD123!"
    Given An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: A valid existing entity is updated
    Given I send a POST request to "/v1/entities" with body:
      """
      { "id": "#id", ... }
      """
    Then the response status code should be 201
    Given I send a PUT request to "/v1/entities/#id" with body:
      """
      { "status": "ACTIVE" }
      """
    Then the response status code should be 200

  Scenario: Attempt to update a non-existing entity returns 404
    Given I send a PUT request to "/v1/entities/$uuid" with body:
      """
      { "status": "ACTIVE" }
      """
    Then the response status code should be 404
```

## Output Contract

Provide all files listed in steps 1–6.
Verify that `operationId` === route handler export name before reporting completion.
Run `make acceptance-tests` if the full Docker stack is available; otherwise confirm the route is registered by checking that `make unit-tests` passes without TypeScript errors.
