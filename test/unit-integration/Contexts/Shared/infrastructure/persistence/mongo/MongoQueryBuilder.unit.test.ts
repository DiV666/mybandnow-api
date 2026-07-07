import { describe, it, expect, vi } from 'vitest';
import { MongoQueryBuilder } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoQueryBuilder.js';
import { TypeQueryEnum } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoCriteriaConverter.js';
import type { Collection } from 'mongodb';

function makeCollection(overrides: Partial<Record<string, unknown>> = {}): Collection {
  return {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([])
    }),
    findOne: vi.fn().mockResolvedValue(null),
    countDocuments: vi.fn().mockResolvedValue(0),
    ...overrides
  } as unknown as Collection;
}

describe('MongoQueryBuilder', () => {
  describe('#find', () => {
    it('delegates to collection.find() with the built query', async () => {
      const builder = new MongoQueryBuilder();
      const collection = makeCollection();

      await builder.find(collection);

      expect(collection.find).toHaveBeenCalledWith(builder.query, builder['options']);
    });
  });

  describe('#findOne', () => {
    it('delegates to collection.findOne() and returns the result', async () => {
      const builder = new MongoQueryBuilder();
      const doc = { _id: 'abc', name: 'test' };
      const collection = makeCollection({ findOne: vi.fn().mockResolvedValue(doc) });

      const result = await builder.findOne(collection);

      expect(collection.findOne).toHaveBeenCalledWith(builder.query, builder['options']);
      expect(result).toBe(doc);
    });

    it('returns null when collection.findOne returns null', async () => {
      const builder = new MongoQueryBuilder();
      const collection = makeCollection();
      const result = await builder.findOne(collection);
      expect(result).toBeNull();
    });
  });

  describe('#count', () => {
    it('delegates to collection.countDocuments() and returns the count', async () => {
      const builder = new MongoQueryBuilder();
      const collection = makeCollection({ countDocuments: vi.fn().mockResolvedValue(42) });

      const result = await builder.count(collection);

      expect(collection.countDocuments).toHaveBeenCalledWith(builder.query);
      expect(result).toBe(42);
    });
  });

  describe('#addNotQuery', () => {
    it('negates the given condition with $not', () => {
      const builder = new MongoQueryBuilder();
      builder.addNotQuery(TypeQueryEnum.ARRAY, 'status', { $in: ['deleted'] });
      expect((builder.query as Record<string, unknown>)['status']).toEqual({ $not: { $in: ['deleted'] } });
    });
  });

  describe('#constructQuery — merging', () => {
    it('merges values on the same field when operators do not collide', () => {
      const builder = new MongoQueryBuilder();
      builder.constructQuery(TypeQueryEnum.RANGE, 'age', { $gt: 18 });
      builder.constructQuery(TypeQueryEnum.RANGE, 'age', { $lt: 65 });
      expect((builder.query as Record<string, unknown>)['age']).toEqual({ $gt: 18, $lt: 65 });
    });

    it('combines colliding operators on the same field with $and instead of overwriting', () => {
      const builder = new MongoQueryBuilder();
      builder.constructQuery(TypeQueryEnum.ARRAY, 'status', { $in: ['active'] });
      builder.constructQuery(TypeQueryEnum.ARRAY, 'status', { $in: ['pending'] });
      expect((builder.query as Record<string, unknown>)['status']).toEqual({ $in: ['active'] });
      expect((builder.query as Record<string, unknown>)['$and']).toEqual([{ status: { $in: ['pending'] } }]);
    });
  });
});
