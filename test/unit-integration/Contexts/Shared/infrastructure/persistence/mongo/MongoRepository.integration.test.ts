import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { Document, MongoClient } from 'mongodb';
import { MongoRepository } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoRepository.js';
import { AggregateRoot } from '../../../../../../../src/Contexts/Shared/domain/AggregateRoot.js';
import { DateValueObject } from '../../../../../../../src/Contexts/Shared/domain/value-object/DateValueObject.js';
import { Index } from '../../../../../../../src/Contexts/Shared/domain/database/Index.js';
import { Sort } from '../../../../../../../src/Contexts/Shared/domain/database/Sort.js';
import { Criteria } from '../../../../../../../src/Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '../../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '../../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator, Operator } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterValue.js';
import { FilterType } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterType.js';
import { Order } from '../../../../../../../src/Contexts/Shared/domain/criteria/Order.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { MongoClientFactory } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoClientFactory.js';
import { MongoEnvironmentArranger } from '../../../../../../utils/arranger/MongoEnvironmentArranger.js';

// ─── Test domain fixtures ─────────────────────────────────────────────────────

class WidgetCreatedAt extends DateValueObject {}

interface WidgetPrimitives extends Record<string, unknown> {
  id: string;
  name: string;
  active: boolean;
}

class Widget extends AggregateRoot {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly active: boolean,
    readonly createdAt?: WidgetCreatedAt
  ) {
    super();
  }

  toPrimitives(): WidgetPrimitives {
    return { id: this.id, name: this.name, active: this.active };
  }

  static from(p: WidgetPrimitives): Widget {
    return new Widget(p.id, p.name, p.active);
  }
}

class WidgetRepository extends MongoRepository<Widget, WidgetPrimitives> {
  protected moduleName(): string {
    return 'widgets_test';
  }

  protected moduleIndexes(): Index[] {
    return [{ keys: [{ field: 'name', sort: Sort.ASC }], name: 'idx_name', background: true }];
  }

  async save(widget: Widget, session?: import('mongodb').ClientSession): Promise<void> {
    await this.persist(widget, session as never);
  }

  async findById(id: string): Promise<Widget | null> {
    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('_id'), new FilterOperator(Operator.EQUAL), new FilterValue(id))]),
      Order.none(),
      1,
      0
    );
    const results = await this.findByCriteria(criteria, Widget.from);
    return results[0] ?? null;
  }

  async findOne(id: string): Promise<Widget | null> {
    return super.findOne(id, Widget.from);
  }

  async findByCriteria(criteria: Criteria, deserialize = Widget.from): Promise<Widget[]> {
    return super.findByCriteria(criteria, deserialize);
  }

  async findOneByCriteria(criteria: Criteria): Promise<Widget | null> {
    return super.findOneByCriteria(criteria, Widget.from);
  }

  async removeById(id: string, session?: import('mongodb').ClientSession): Promise<void> {
    await this.deleteOne(id, session as never);
  }

  async countByCriteria(criteria: Criteria): Promise<number> {
    return super.countByCriteria(criteria);
  }

  async allWidgets(): Promise<Widget[]> {
    return this.findAll(Widget.from);
  }

  async aggregate(criteria: Criteria, pipeline: Document[]): Promise<Document[]> {
    return super.aggregateQuery(criteria, pipeline);
  }

  async underlyingClient(): Promise<MongoClient> {
    return this.client();
  }
}

// ─── Test setup ───────────────────────────────────────────────────────────────

describe('MongoRepository integration', () => {
  let client: MongoClient;
  let repo: WidgetRepository;
  let arranger: MongoEnvironmentArranger;

  beforeAll(async () => {
    client = await MongoClientFactory.createClient(
      'widget-test',
      {
        uri: process.env.MONGO_URI as string,
        user: process.env.MONGO_USER as string,
        pass: process.env.MONGO_PASS as string,
        maxPoolSize: 5
      },
      mock<Logger>()
    );
    const clientPromise = Promise.resolve(client);
    repo = new WidgetRepository(clientPromise);
    arranger = new MongoEnvironmentArranger(clientPromise);
    await repo.initialize();
  });

  afterAll(async () => {
    await arranger.close();
  });

  beforeEach(async () => {
    await arranger.arrange();
  });

  // ─── persist & findAll ──────────────────────────────────────────────────────

  it('persists a new entity and retrieves it via findAll', async () => {
    // Arrange
    const widget = new Widget('w-001', 'Gadget Alpha', true);

    // Act
    await repo.save(widget);
    const all = await repo.allWidgets();

    // Assert
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Gadget Alpha');
    expect(all[0].active).toBe(true);
  });

  it('upserts an existing entity (replaceOne with upsert)', async () => {
    // Arrange
    const widget = new Widget('w-002', 'Widget Beta', true);
    await repo.save(widget);

    const updated = new Widget('w-002', 'Widget Beta v2', false);

    // Act
    await repo.save(updated);
    const all = await repo.allWidgets();

    // Assert
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Widget Beta v2');
  });

  // ─── findByCriteria ─────────────────────────────────────────────────────────

  it('finds entities matching EQUAL filter', async () => {
    // Arrange
    await repo.save(new Widget('w-003', 'Alpha', true));
    await repo.save(new Widget('w-004', 'Beta', false));

    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('name'),
          new FilterOperator(Operator.EQUAL),
          new FilterValue('Alpha'),
          new FilterType('string')
        )
      ]),
      Order.none(),
      10,
      0
    );

    // Act
    const results = await repo.findByCriteria(criteria);

    // Assert
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Alpha');
  });

  it('returns empty array when no entities match', async () => {
    await repo.save(new Widget('w-005', 'Gamma', true));
    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('name'),
          new FilterOperator(Operator.EQUAL),
          new FilterValue('NonExistent'),
          new FilterType('string')
        )
      ]),
      Order.none(),
      10,
      0
    );

    const results = await repo.findByCriteria(criteria);
    expect(results).toHaveLength(0);
  });

  it('finds entities matching CONTAINS (wildcard) filter', async () => {
    await repo.save(new Widget('w-006', 'Super Widget', true));
    await repo.save(new Widget('w-007', 'Normal Item', false));

    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('name'),
          new FilterOperator(Operator.CONTAINS),
          new FilterValue('Widget'),
          new FilterType('string')
        )
      ]),
      Order.none(),
      10,
      0
    );

    const results = await repo.findByCriteria(criteria);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Super Widget');
  });

  // ─── countByCriteria ────────────────────────────────────────────────────────

  it('counts documents matching a criteria', async () => {
    await repo.save(new Widget('w-008', 'Widget One', true));
    await repo.save(new Widget('w-009', 'Widget Two', true));
    await repo.save(new Widget('w-010', 'Other', false));

    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('active'),
          new FilterOperator(Operator.EQUAL),
          new FilterValue('true'),
          new FilterType('boolean')
        )
      ]),
      Order.none(),
      100,
      0
    );

    const count = await repo.countByCriteria(criteria);
    expect(count).toBe(2);
  });

  // ─── deleteOne ──────────────────────────────────────────────────────────────

  it('deletes an entity by id', async () => {
    await repo.save(new Widget('w-011', 'Doomed Widget', true));
    await repo.removeById('w-011');
    const all = await repo.allWidgets();
    expect(all).toHaveLength(0);
  });

  it('does not throw when deleting a non-existent id', async () => {
    await expect(repo.removeById('non-existent-id')).resolves.not.toThrow();
  });

  it('persists and deletes within a provided MongoDB session', async () => {
    const session = client.startSession();

    try {
      await repo.save(new Widget('w-012', 'Sessioned Widget', true), session);
      const created = await repo.findOne('w-012');
      expect(created?.name).toBe('Sessioned Widget');

      await repo.removeById('w-012', session);
      const afterDelete = await repo.findOne('w-012');
      expect(afterDelete).toBeNull();
    } finally {
      await session.endSession();
    }
  });

  // ─── findByCriteria — pagination ────────────────────────────────────────────

  it('respects limit in criteria', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.save(new Widget(`w-p${i}`, `Widget ${i}`, true));
    }
    // Criteria(filters, order, limit, offset)
    const criteria = new Criteria(Filters.none(), Order.none(), 3, 0);
    const results = await repo.findByCriteria(criteria);
    expect(results).toHaveLength(3);
  });

  it('respects offset in criteria', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.save(new Widget(`w-o${i}`, `Widget ${i}`, true));
    }
    // Criteria(filters, order, limit, offset) — skip first 3, take up to 10
    const criteria = new Criteria(Filters.none(), Order.none(), 10, 3);
    const results = await repo.findByCriteria(criteria);
    expect(results).toHaveLength(2);
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  it('finds an entity by id via findOne', async () => {
    // Arrange
    await repo.save(new Widget('w-fo1', 'Findable', true));

    // Act
    const found = await repo.findOne('w-fo1');

    // Assert
    expect(found?.name).toBe('Findable');
  });

  it('returns null from findOne when no entity matches the id', async () => {
    // Act
    const found = await repo.findOne('non-existent-id');

    // Assert
    expect(found).toBeNull();
  });

  // ─── findOneByCriteria ──────────────────────────────────────────────────────

  it('finds a single entity matching a criteria', async () => {
    // Arrange
    await repo.save(new Widget('w-foc1', 'UniqueName', true));

    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('name'),
          new FilterOperator(Operator.EQUAL),
          new FilterValue('UniqueName'),
          new FilterType('string')
        )
      ]),
      Order.none(),
      1,
      0
    );

    // Act
    const found = await repo.findOneByCriteria(criteria);

    // Assert
    expect(found?.id).toBe('w-foc1');
  });

  it('returns null from findOneByCriteria when no entity matches', async () => {
    // Arrange
    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('name'),
          new FilterOperator(Operator.EQUAL),
          new FilterValue('NoSuchWidget'),
          new FilterType('string')
        )
      ]),
      Order.none(),
      1,
      0
    );

    // Act
    const found = await repo.findOneByCriteria(criteria);

    // Assert
    expect(found).toBeNull();
  });

  // ─── persist — DateValueObject fields ──────────────────────────────────────

  it('persists DateValueObject fields as raw Date values', async () => {
    // Arrange
    const createdAt = new WidgetCreatedAt('2024-01-15T10:00:00.000Z');
    const widget = new Widget('w-date1', 'Dated Widget', true, createdAt);

    // Act
    await repo.save(widget);
    const client = await repo.underlyingClient();
    const raw = await client
      .db()
      .collection('widgets_test')
      .findOne({ _id: 'w-date1' } as never);

    // Assert
    expect(raw?.createdAt).toBeInstanceOf(Date);
    expect((raw?.createdAt as Date).toISOString()).toBe('2024-01-15T10:00:00.000Z');
  });

  // ─── aggregateQuery ─────────────────────────────────────────────────────────

  it('runs an aggregation pipeline scoped by criteria', async () => {
    // Arrange
    await repo.save(new Widget('w-agg1', 'Aggregatable', true));
    await repo.save(new Widget('w-agg2', 'Aggregatable', true));
    await repo.save(new Widget('w-agg3', 'Other', false));
    const criteria = new Criteria(
      new Filters([
        new Filter(
          new FilterField('name'),
          new FilterOperator(Operator.EQUAL),
          new FilterValue('Aggregatable'),
          new FilterType('string')
        )
      ]),
      Order.none(),
      100,
      0
    );

    // Act
    const results = await repo.aggregate(criteria, [{ $count: 'total' }]);

    // Assert
    expect(results).toEqual([{ total: 2 }]);
  });

  // ─── client ─────────────────────────────────────────────────────────────────

  it('exposes the underlying MongoClient', async () => {
    // Act
    const underlyingClient = await repo.underlyingClient();

    // Assert
    expect(underlyingClient).toBe(client);
  });
});
