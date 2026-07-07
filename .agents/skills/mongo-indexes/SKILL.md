---
name: mongo-indexes
description: >
  MongoDB index planning for MongoRepository implementations.
  Trigger: When adding a filter field to a query, creating a GET/search endpoint, or modifying moduleIndexes() in any repository.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Adding filters to a repository'
    - 'Creating a GET/search endpoint'
    - 'Modifying moduleIndexes()'
    - 'Adding criteria to a query handler'
---

## Activation Contract

Use this skill whenever you add a field to a Criteria-based query (filter or sort) or create a new GET endpoint.
The goal is to prevent full collection scans in production caused by unindexed fields.

## Hard Rules (NEVER Break)

- **Every filter field needs an index**: If a field appears in a `Filter` that the `MongoCriteriaConverter` will query, it MUST have an index in `moduleIndexes()`.
- **Every sort field needs an index**: If a field appears in `criteria.order`, it MUST be indexed — either standalone or as the last field in a compound index.
- **Compound index field order matters**: Place the most selective filter fields first, the sort field last. Example: filter by `status` + sort by `createdAt` → one `Index` with `keys: [{ field: 'status', sort: Sort.ASC }, { field: 'createdAt', sort: Sort.ASC }]`.
- **`moduleIndexes()` is the single source of truth**: NEVER create indexes manually in MongoDB or in migration scripts outside of this method.

## Decision Gates

| Situation                                    | Action                                                         |
| -------------------------------------------- | -------------------------------------------------------------- |
| Single filter field, no sort                 | Add one single-field index                                     |
| Multiple filter fields queried together      | Add one compound index covering all filter fields              |
| Filter + sort in the same query              | Compound index: filter fields first, sort field last           |
| Field that must be unique (e.g. external ID) | Add with `unique: true`                                        |
| Boolean field as the only filter             | Skip — low cardinality, index has minimal benefit              |
| Collection has < 1000 documents              | Skip — MongoDB does collection scans efficiently at this scale |
| Same field already in another index          | Reuse or extend that index rather than adding a duplicate      |

## The `moduleIndexes()` Pattern

Every `MongoRepository` subclass overrides this method. It returns `[]` by default — which means **no indexes**.

```typescript
import { Index } from '../../../../Shared/domain/database/Index.js';
import { Sort } from '../../../../Shared/domain/database/Sort.js';

export class OrderMongoRepository
  extends MongoRepository<Order, OrderPrimitives>
  implements OrderPersistenceRepository
{
  protected moduleName(): string {
    return 'orders';
  }

  protected moduleIndexes(): Index[] {
    return [
      // Single field — for queries that filter by status alone
      { keys: [{ field: 'status', sort: Sort.ASC }] },

      // Compound — one Index entry with two keys, for queries that filter by companyId and sort by createdAt
      {
        keys: [
          { field: 'companyId', sort: Sort.ASC },
          { field: 'createdAt', sort: Sort.ASC }
        ]
      },

      // Unique — for external provider ID (never duplicated)
      // Note: unique indexes require the MongoRepository.persist() to handle DuplicateKeyError
      { keys: [{ field: 'externalId', sort: Sort.ASC }], unique: true }
    ];
  }
}
```

The `Index` and `Key` interfaces (`Shared/domain/database/Index.ts` and `Shared/domain/database/Key.ts`):

```typescript
export interface Index {
  keys: Key[]; // one entry per indexed field; multiple keys in one Index = compound index
  name?: string;
  background?: boolean;
  unique?: boolean;
}

export interface Key {
  field: string;
  sort: Sort; // Sort.ASC | Sort.DESC | Sort.NONE
}
```

## Checklist — Run This Every Time You Add a Filter or Sort

1. Open the Query or Criteria object being passed to `matching()`.
2. List every field used in `FilterField` values.
3. List the `orderBy` field if ordering is applied.
4. Open the corresponding `MongoRepository` subclass.
5. Check that `moduleIndexes()` contains an entry for each field from steps 2 and 3.
6. If the same query uses multiple fields together (e.g. `status` + `createdAt`), confirm there is a **compound** index, not two separate single-field indexes.
7. Add any missing indexes.

## Examples from This Project

```typescript
// OrderMongoRepository — queries that filter by userId, companyId, status, or createdAt
protected moduleIndexes(): Index[] {
  return [
    { keys: [{ field: 'userId', sort: Sort.ASC }] },
    { keys: [{ field: 'companyId', sort: Sort.ASC }] },
    // Compound — filter by status, sort by createdAt (one Index, two keys)
    {
      keys: [
        { field: 'status', sort: Sort.ASC },
        { field: 'createdAt', sort: Sort.DESC }
      ]
    }
  ];
}

// AuditMongoRepository — queries that filter by aggregateId and sort by occurredAt (audit log lookups)
protected moduleIndexes(): Index[] {
  return [
    {
      keys: [
        { field: 'aggregateId', sort: Sort.ASC },
        { field: 'occurredAt', sort: Sort.DESC }
      ]
    }
  ];
}
```

## Output Contract

When this skill is invoked, return the updated `moduleIndexes()` array alongside any other changes.
Include a brief comment per index explaining which query pattern it supports.
