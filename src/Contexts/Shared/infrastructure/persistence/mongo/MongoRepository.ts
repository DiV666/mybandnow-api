import { ClientSession, Collection, Document, MongoClient, WithId } from 'mongodb';
import { DateValueObject } from '../../../domain/value-object/DateValueObject.js';
import { AggregateRoot } from '../../../domain/AggregateRoot.js';
import { Criteria } from '../../../domain/criteria/Criteria.js';
import { Index } from '../../../domain/database/Index.js';
import { Nullable } from '../../../domain/Nullable.js';
import { TransactionSession } from '../../../domain/Outbox.js';
import { MongoCriteriaConverter } from './MongoCriteriaConverter.js';
import { MongoIndexConverter } from './MongoIndexConverter.js';
import { MongoQueryBuilder } from './MongoQueryBuilder.js';

export abstract class MongoRepository<T extends AggregateRoot, P> {
  private readonly criteriaConverter: MongoCriteriaConverter;
  private readonly indexConverter: MongoIndexConverter;

  constructor(private _client: Promise<MongoClient>) {
    this.criteriaConverter = new MongoCriteriaConverter();
    this.indexConverter = new MongoIndexConverter();
  }

  protected abstract moduleName(): string;
  protected abstract moduleIndexes(): Index[];

  protected client(): Promise<MongoClient> {
    return this._client;
  }

  protected async collection(): Promise<Collection> {
    return (await this._client).db().collection(this.moduleName());
  }

  /**
   * Creates MongoDB indexes for this repository's collection.
   * Must be called explicitly at application startup (via initialize()).
   */
  protected async indexes(): Promise<void> {
    const collection = await this.collection();
    for (const index of this.moduleIndexes()) {
      const indexBuilder = this.indexConverter.convert(index).getIndex();
      await collection.createIndex(indexBuilder.key, indexBuilder.options);
    }
  }

  /**
   * Bootstraps the repository: creates indexes and any other async setup.
   * Call this after construction, before handling requests.
   */
  public async initialize(): Promise<void> {
    await this.indexes();
  }

  /**
   * Persists an aggregate root to MongoDB.
   * Supports optional MongoDB session for transactions.
   *
   * @param aggregateRoot - The aggregate to persist
   * @param session - Optional transaction session for transactional persistence
   *
   * @example Without transaction
   * ```typescript
   * await this.persist(user);
   * ```
   *
   * @example With transaction
   * ```typescript
   * const session = mongoClient.startSession();
   * await session.withTransaction(async () => {
   *   await this.persist(user, session);
   *   await this.outbox.save(user.pullDomainEvents(), session);
   * });
   * ```
   */
  protected async persist(aggregateRoot: T, session?: TransactionSession): Promise<void> {
    const collection = await this.collection();
    const mongoSession = session as ClientSession | undefined;

    const { _id, ...document } = this.toDocument(aggregateRoot);

    const options = mongoSession ? { session: mongoSession, upsert: true } : { upsert: true };
    // replaceOne (instead of updateOne + $set) so fields removed from the aggregate
    // are also removed from the persisted document
    await collection.replaceOne({ _id }, document, options);
  }

  private toDocument(aggregateRoot: T): Document {
    const { id: _id, ...primitives } = aggregateRoot.toPrimitives();
    const document: Record<string, unknown> = { _id, ...primitives };

    for (const key of Object.keys(aggregateRoot)) {
      const property = (aggregateRoot as Record<string, unknown>)[key];

      if (property instanceof DateValueObject) {
        document[key] = property.value;
      }
    }
    return document;
  }

  protected async findAll(unserializer: (data: P) => T): Promise<T[]> {
    const collection = await this.collection();

    const document = await collection.find().limit(1000).toArray();

    return document.map((doc) => unserializer({ ...doc, id: doc._id } as P));
  }

  public async findOne(id: string, unserializer: (data: P) => T): Promise<Nullable<T>> {
    const collection = await this.collection();

    const document = await collection.findOne({ _id: id as string & Document['_id'] });
    if (!document) {
      return null;
    }

    return unserializer(this.convertDocumentToP(document));
  }

  protected async findByCriteria(criteria: Criteria, unserializer: (data: P) => T): Promise<T[]> {
    const body = this.criteriaConverter.convert(criteria);

    return this.findWithBuilder(unserializer, body);
  }

  protected async findOneByCriteria(criteria: Criteria, unserializer: (data: P) => T): Promise<Nullable<T>> {
    const body = this.criteriaConverter.convert(criteria);

    return this.findOneWithBuilder(unserializer, body);
  }

  private async findWithBuilder(unserializer: (data: P) => T, body: MongoQueryBuilder): Promise<T[]> {
    const collection = await this.collection();

    const documents = await body.find(collection);

    return documents.map((document) => unserializer(this.convertDocumentToP(document)));
  }

  private async findOneWithBuilder(unserializer: (data: P) => T, body: MongoQueryBuilder): Promise<Nullable<T>> {
    const collection = await this.collection();

    const document = await body.findOne(collection);
    if (!document) {
      return null;
    }

    return unserializer(this.convertDocumentToP(document));
  }

  private async countWithBuilder(body: MongoQueryBuilder): Promise<number> {
    const collection = await this.collection();

    const documents = await body.count(collection);

    return documents;
  }

  protected async countByCriteria(criteria: Criteria): Promise<number> {
    const body = this.criteriaConverter.convert(criteria);

    return this.countWithBuilder(body);
  }

  /**
   * Deletes a single document by ID.
   * Supports optional transaction session for transactional deletion.
   *
   * @param id - The document ID to delete
   * @param session - Optional transaction session for transactional deletion
   */
  public async deleteOne(id: string, session?: TransactionSession): Promise<void> {
    const collection = await this.collection();
    const mongoSession = session as ClientSession | undefined;

    const options = mongoSession ? { session: mongoSession } : {};
    await collection.deleteOne({ _id: id as string & Document['_id'] }, options);
  }

  private convertDocumentToP(document: WithId<Document>): P {
    const data: unknown = {
      id: document._id,
      ...Object.fromEntries(Object.entries(document).filter(([key]) => key !== '_id'))
    };
    return data as P;
  }

  protected async aggregateQuery(criteria: Criteria, aggregateQuery: Document[]): Promise<Document[]> {
    const match = await this.criteriaConverter.convert(criteria);
    const body = [
      {
        $match: match.query
      },
      ...aggregateQuery
    ];
    const collection = await this.collection();
    const data = await collection.aggregate(body).toArray();
    return data;
  }
}
