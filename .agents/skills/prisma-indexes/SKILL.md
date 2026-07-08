---
name: prisma-indexes
description: >
  PostgreSQL / Prisma index planning for database models.
  Trigger: When adding a filter field to a query, creating a GET/search endpoint, or modifying the schema.prisma file.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Adding filters to a repository'
    - 'Creating a GET/search endpoint'
    - 'Modifying schema.prisma indexes'
    - 'Adding criteria to a query handler'
---

## Activation Contract

Use this skill whenever you add a field to a Criteria-based query (filter or sort) or create a new GET endpoint.
The goal is to prevent full table scans in PostgreSQL in production caused by unindexed fields.

## Hard Rules (NEVER Break)

- **Every filter field needs an index**: If a field appears in a `Filter` that Prisma will query, it MUST have an index in `schema.prisma`.
- **Every sort field needs an index**: If a field is used for sorting (`orderBy`), it MUST be indexed — either standalone or as part of a compound index.
- **Compound index field order matters**: Place the most selective filter fields first, the sort field last. Example: filter by `status` + sort by `createdAt` → `@@index([status, createdAt])`.
- **`schema.prisma` is the single source of truth**: NEVER create indexes manually in PostgreSQL or in migration scripts outside of the Prisma schema.

## Decision Gates

| Situation                                    | Action                                                         |
| -------------------------------------------- | -------------------------------------------------------------- |
| Single filter field, no sort                 | Add `@unique` or `@@index([field])`                            |
| Multiple filter fields queried together      | Add one compound index `@@index([field1, field2])` covering all filter fields |
| Filter + sort in the same query              | Compound index: filter fields first, sort field last           |
| Field that must be unique (e.g. external ID) | Use `@unique` or `@@unique([field1, field2])`                  |
| Boolean field as the only filter             | Skip — low cardinality, index has minimal benefit              |

## The `schema.prisma` Pattern

Every index must be declared in the `schema.prisma` file directly in the model.

```prisma
model Order {
  id         String   @id @default(uuid())
  userId     String
  companyId  String
  status     String
  createdAt  DateTime @default(now())

  // Single field — for queries that filter by status alone
  @@index([status])

  // Compound — for queries that filter by companyId and sort by createdAt
  @@index([companyId, createdAt])
}
```

## Checklist — Run This Every Time You Add a Filter or Sort

1. Open the Query or Criteria object being passed to your use case or repository.
2. List every field used in `FilterField` values.
3. List the `orderBy` field if ordering is applied.
4. Open `prisma/schema.prisma`.
5. Check that the corresponding model contains an `@@index` (or `@unique`) for each field from steps 2 and 3.
6. If the same query uses multiple fields together (e.g. `status` + `createdAt`), confirm there is a **compound** index (`@@index([status, createdAt])`), not two separate single-field indexes.
7. Add any missing indexes.
8. Run `npx prisma format` and generate the client.

## Output Contract

When this skill is invoked, return the updated `schema.prisma` changes.
Include a brief comment explaining which query pattern each new index supports.
