---
name: zod-4
description: >
  Zod 4 schema validation patterns strictly for Environment Variables.
  Trigger: When modifying src/Contexts/Shared/infrastructure/config/env.ts or validating startup configurations.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root, backend]
  auto_invoke:
    - 'Modifying the Zod env schema'
---

## Activation Contract

Use this skill EXCLUSIVELY when working with environment variable validation at startup (specifically inside `src/Contexts/Shared/infrastructure/config/env.ts`). Do NOT use this skill for request payloads or API validation (which is handled by `openapi-backend`).

## Hard Rules (NEVER Break)

- **Only for Environment Variables**: Zod is used strictly for parsing and validating `process.env`. Do not use it in Domain or Application layers.
- **Always Coerce Non-Strings**: `process.env` values are always strings. You MUST use `z.coerce.number()` for numbers and `z.enum(['true', 'false'])` for booleans.
- **Never Use Primitives Directly**: Do not use `z.number()` or `z.boolean()` directly for env vars, as they will fail at runtime.
- **Cross-Validation**: If an environment variable depends on another (e.g., a provider URL and its Token), you MUST use `.refine()` on the schema to validate their coexistence. Chain multiple `.refine()` calls for multiple cross-validations (one per pair).

## Decision Gates

| Situation                                    | Action                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| You need to validate an API request payload  | DO NOT use Zod. Use `definition.json` (OpenAPI).                                                                                                    |
| You need to parse a boolean env var          | Use `z.enum(['true', 'false'])`.                                                                                                                    |
| You have paired env vars (e.g. Origin/Token) | Chain `.refine()` calls on the schema — one per pair. Example: `.refine(env => !(env.PROVIDER_ORIGIN && !env.PROVIDER_TOKEN), { message: '...' })`. |

## Execution Steps

1. Open `src/Contexts/Shared/infrastructure/config/env.ts`.
2. Add the individual Zod definitions using coercion and `.min(1)` or `.url()` as necessary.
3. If variables are paired, chain `.refine()` calls after the schema definition — one per directional dependency.
4. Export the inferred type so it is available globally across the application.

## Output Contract

Provide the updated Zod schema for the environment variables, ensuring all primitives are properly coerced and cross-validations are in place.
