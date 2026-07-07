---
name: typescript
description: >
  TypeScript strict patterns and best practices for Hexagonal Architecture.
  Trigger: When implementing or refactoring TypeScript in .ts files (types, interfaces, generics, const maps, type guards).
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root, backend]
  auto_invoke:
    - 'Writing TypeScript types/interfaces'
---

## Activation Contract

Use this skill whenever you are writing TypeScript types, interfaces, or classes. This skill enforces strict typings, prohibits `any`, and enforces Value Object encapsulation rules specific to our Hexagonal Architecture.

## Hard Rules (NEVER Break)

- **No `any`**: PROHIBITED to use `any`. Use `unknown` for truly unknown types and narrow them with Type Guards.
- **Flat Interfaces**: NEVER inline nested objects. Always create a dedicated interface for the nested object.
- **The `as const` Pattern**: Avoid using the `enum` keyword. Use a constant object with `as const` and extract its structural union type.
- **Coupled Optionals**: Do not use independent optional properties if they are semantically coupled. Use Discriminated Unions.
- **Primitive Wrapping (Value Objects)**: In the Domain layer, domain entities must NOT use primitives (string, number) directly for their internal state. They MUST use encapsulating Value Objects (e.g., `OrderId`, `OrderStatus`) that validate the primitive upon instantiation.

## Decision Gates

| Situation                                    | Action                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| You need an Enum                             | Use `const X = { ... } as const;` and `type XType = typeof X[keyof typeof X];`. |
| You need to define a nested object shape     | Create a separate `interface` and reference it.                                 |
| You are defining a Domain Aggregate property | Create a Value Object class that wraps and validates the primitive.             |

## Execution Steps

1. Analyze the required data structure.
2. If the data represents a Domain concept, create a Value Object to encapsulate validation.
3. If creating interfaces, ensure they are flat. Extract nested structures into separate interfaces.
4. If creating finite states/options, use the `as const` pattern.
5. If defining conditional props, use Discriminated Unions.

## Output Contract

Provide the TypeScript code ensuring strict types, Value Object encapsulation, and absence of `any` or `enum`.
