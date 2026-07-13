---
name: rubricae-generate-parameter
description: "Trigger: add parameter, generate parameter, añadir parámetro, rb generate parameter, rb g p, generate global-parameter, global-parameter, rb generate global-parameter, rb g gp. Add domain or controller parameters to a Rubricae module non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.1"
---

## Activation Contract

Use this skill when asked to add a field, property, or parameter to an existing Rubricae domain module or controller.

---

## Hard Rules

1. **Always run non-interactively** — pass all arguments positionally, never rely on prompts.
2. **camelCase for parameter names** — `apiUrl`, `statusType`, not `api_url` or `StatusType`.
3. **PascalCase for context and module** — `Configs`, `Communicator`.
4. **Aggregate must exist before adding parameters** — run `rb g a` first if needed.
5. **`global-parameter` = aggregate + controller together** — use it when the field spans both layers.
6. **Enum values in SCREAMING_SNAKE_CASE** — `PENDING`, `SENT`, `ERROR`.
7. **Enums are always interactive** — `rb g p aggregate` and `rb g gp` hang waiting for values when type=`enum`. Use `rb g f` with the correct JSON format instead (see `assets/cli-help.md`).
8. **If the CLI fails or hangs**, check `assets/cli-help.md` and verify argument order.

---

## Command Reference

### Domain parameter — adds VO, updates aggregate, mothers, use cases and events

```bash
rb generate parameter aggregate <Context> <Module> <name> <type> <nullable>
# alias: rb g p aggregate <Context> <Module> <name> <type> <nullable>

# types:    string | number | uuid | boolean | date | uri | enum
# nullable: true | false
```

### Controller parameter — adds field to controller, command/query, and Swagger

```bash
rb generate parameter controller <App> <Module> <action> <name> <type> <location> <required>
# alias: rb g p controller <App> <Module> <action> <name> <type> <location> <required>

# action:   create | update
# type:     string | number | boolean | uuid | uri | date-time | enum
# location: body | query
# required: true | false
```

### Global parameter — runs domain + controller in one step

```bash
rb generate global-parameter <Context> <Module> <name> <type> <nullable>
# alias: rb g gp <Context> <Module> <name> <type> <nullable>
```

---

## What Each Command Updates

### `rb g p aggregate` touches:

| File | Change |
|------|--------|
| `domain/value-object/<Module><Name>.ts` | **Created** — new VO |
| `domain/<Module>.ts` | Adds field to `Primitives`, constructor, `fromPrimitives`, `toPrimitives`, `create()` params |
| `domain/<Module>CreatedDomainEvent.ts` | Adds field to attributes type |
| `domain/<Module>UpdatedDomainEvent.ts` | Adds field to attributes type |
| `domain/<Module>RemovedDomainEvent.ts` | Adds field to attributes type |
| `application/create/<Module>Creator.ts` | Adds param to `run()` destructuring and `create()` call |
| `application/create/Create<Module>Command.ts` | Adds `readonly <name>` property |
| `application/update/<Module>Updater.ts` | Adds param to `run()` and `params` object |
| `application/update/Update<Module>Command.ts` | Adds `readonly <name>` property |
| `test/.../domain/<Module>Mother.ts` | Adds field with VO Mother value |
| `test/.../domain/<Module><Name>Mother.ts` | **Created** — new VO Mother |
| `test/.../create/Create<Module>CommandMother.ts` | Adds field with random value |
| `test/.../domain/<Module>.unit.test.ts` | Adds param to `create()` call in `#create` test |

### `rb g p controller` touches:

The files updated depend on the param `location`:

| File | `body` param | `query` param |
|------|:---:|:---:|
| `apps/.../controllers/<module>/<Controller>.ts` | ✅ Adds `const <name>` extraction from `req.body` and passes it to `new <Action>Command(id, <name>)` | ✅ Adds `const <name>` extraction from `req.query` only |
| `application/create/Create<Module>Command.ts` | ✅ Adds `readonly <name>` to the constructor | ❌ Not touched |
| `test/.../create/Create<Module>CommandMother.ts` | ✅ Adds `<name>` to `defaults()` and to `new Create<Module>Command(commandData.id, commandData.<name>)` | ❌ Not touched |
| `apps/.../config/swagger/definition.json` | ✅ Adds property to request schema | ✅ Adds property to request schema |
| `test/acceptance/features/<module>/<action>.feature` | ✅ Updated | ✅ Updated |

**Rule:** `query` params are orchestration-only (e.g. `?type=pdf`, `?format=html`). They stay in the controller and never propagate to the Command. `body` params carry domain intent and must be reflected in the Command constructor and its test Mother.

> **Note:** `fromModel()` in the CommandMother is **not updated** for controller params. Controller params (body or query) are not part of the aggregate's `toPrimitives()` output, so there is no way to reconstruct them from a domain model.

---

## Enum pattern

Enum VOs use `const` objects, NOT TypeScript `enum`:

```typescript
export const CommunicatorTypeValues = {
  HTTP: 'HTTP',
  GRPC: 'GRPC',
  AMQP: 'AMQP',
} as const;

export type CommunicatorTypeType = (typeof CommunicatorTypeValues)[keyof typeof CommunicatorTypeValues];

export class CommunicatorType extends EnumValueObject<CommunicatorTypeType> {
  constructor(value: CommunicatorTypeType) {
    super(value, Object.values(CommunicatorTypeValues));
  }

  static fromString(value: string): CommunicatorType {
    const values = Object.values(CommunicatorTypeValues) as CommunicatorTypeType[];
    if (!values.includes(value as CommunicatorTypeType)) {
      throw new InvalidArgumentException({ code: 'INVALID_ARGUMENT', message: `The filter CommunicatorType <${value}> is invalid` });
    }
    return new CommunicatorType(value as CommunicatorTypeType);
  }
  // ...
}
```

> `fromValue()` does NOT exist. Use `fromString()` everywhere.

---

## Full example — all types

```bash
# Non-enum types via global-parameter (domain + controller in one step)
rb g gp Configs Communicator name     string  false
rb g gp Configs Communicator retries  number  false
rb g gp Configs Communicator active   boolean true
rb g gp Configs Communicator refId    uuid    false
rb g gp Configs Communicator sentAt   date    true
rb g gp Configs Communicator endpoint uri     false

# Enum type — MUST use from-file (interactive otherwise)
# See assets/cli-help.md for the exact JSON format
rb g f /path/to/config.json

```

```json
{
  "Configs": {
    "Communicator": {
      "use-cases": [],
      "attributes": {
        "status": { "type": "enum", "nullable": false, "values": ["PENDING", "ACTIVE"] }
      }
    }
  }
}
```

---

## References

- `assets/cli-help.md` — full `--help` output for parameter, global-parameter, and from-file
