import { Collection, Document, Filter, Sort, SortDirection, WithId } from 'mongodb';
import { TypeQueryEnum } from './MongoCriteriaConverter.js';

export class MongoQueryBuilder {
  public query: Filter<Document> = {};
  private options: Record<string, unknown> = {};
  private querySort: Sort = { _id: 'asc' };
  private queryLimit = 1000;
  private queryOffset = 0;

  async find(collection: Collection): Promise<Array<WithId<Document>>> {
    return collection
      .find(this.query, this.options)
      .sort(this.querySort)
      .limit(this.queryLimit)
      .skip(this.queryOffset)
      .toArray();
  }

  async findOne(collection: Collection): Promise<WithId<Document> | null> {
    return collection.findOne(this.query, this.options);
  }

  async count(collection: Collection): Promise<number> {
    return collection.countDocuments(this.query);
  }

  addQuery(type: TypeQueryEnum, field: string, value: Record<string, unknown>): void {
    this.constructQuery(type, field, value);
  }

  addNotQuery(type: TypeQueryEnum, field: string, value: Record<string, unknown>): void {
    this.constructQuery(type, field, { $not: value });
  }

  constructQuery(type: TypeQueryEnum, field: string, value: Record<string, unknown>): void {
    const existing = this.query[field] as Record<string, unknown> | undefined;

    if (!existing) {
      this.query[field] = value;
      return;
    }

    const hasOperatorCollision = Object.keys(value).some((operator) => operator in existing);

    if (hasOperatorCollision) {
      // Same operator on the same field: combine with $and instead of silently overwriting
      const andConditions = (this.query.$and as Array<Record<string, unknown>> | undefined) ?? [];
      this.query.$and = [...andConditions, { [field]: value }];
      return;
    }

    this.query[field] = { ...existing, ...value };
  }

  sort(sortBy: string, sortType: SortDirection): void {
    this.querySort = { [sortBy]: sortType };
  }

  size(limit: number): void {
    this.queryLimit = limit;
  }

  skip(offset: number): void {
    this.queryOffset = offset;
  }
}
