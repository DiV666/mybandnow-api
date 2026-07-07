import { ClientSession, Collection, MongoClient } from 'mongodb';
import { DomainEvent } from '../../../domain/DomainEvent.js';
import { Outbox, OutboxEvent, TransactionSession } from '../../../domain/Outbox.js';
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer.js';
import { UuidValueObject } from '../../../domain/value-object/UuidValueObject.js';

export class OutboxMongoRepository implements Outbox {
  static readonly collectionName = 'outbox';

  /**
   * Grace period applied by pending(): only rows older than this threshold are selected.
   * It gives OutboxEventBus.publish() time to call markAsPublished() before the
   * OutboxPublisher poller picks up the same row, avoiding happy-path double publishes.
   * Kept consistent with the poller's pollIntervalMs (5000 ms).
   */
  static readonly defaultPendingGraceMs = 5000;

  constructor(
    private readonly client: Promise<MongoClient>,
    private readonly pendingGraceMs: number = OutboxMongoRepository.defaultPendingGraceMs
  ) {}

  private async collection(): Promise<Collection> {
    return (await this.client).db().collection(OutboxMongoRepository.collectionName);
  }

  /**
   * Bootstraps the repository: creates the compound index that supports the
   * polling query used by pending() — find({ status: 'pending' }).sort({ createdAt: 1 }).
   * Must be called at application startup, before handling requests.
   */
  async initialize(): Promise<void> {
    const collection = await this.collection();
    await collection.createIndex({ status: 1, createdAt: 1 });
  }

  async save(events: DomainEvent[], session?: TransactionSession): Promise<string[]> {
    const mongoSession = session as ClientSession | undefined;
    if (events.length === 0) return [];

    const collection = await this.collection();
    const documents = events.map((event) => ({
      _id: UuidValueObject.random() as never,
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
      payload: DomainEventJsonSerializer.serialize(event),
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    }));

    // Use session if provided (for transactions)
    const options = mongoSession ? { session: mongoSession } : {};
    await collection.insertMany(documents, options);

    return documents.map((document) => String(document._id));
  }

  async pending(limit: number): Promise<OutboxEvent[]> {
    const collection = await this.collection();
    const graceThreshold = new Date(Date.now() - this.pendingGraceMs);
    const documents = await collection
      .find({ status: 'pending', createdAt: { $lte: graceThreshold } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();

    return documents.map((doc) => ({
      id: String(doc._id),
      eventId: doc.eventId as string,
      eventName: doc.eventName as string,
      aggregateId: doc.aggregateId as string,
      occurredOn: doc.occurredOn as Date,
      payload: doc.payload as string,
      status: doc.status as 'pending',
      attempts: doc.attempts as number,
      publishedAt: doc.publishedAt as Date | undefined,
      errorMessage: doc.errorMessage as string | undefined
    }));
  }

  async markAsPublished(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const collection = await this.collection();
    await collection.updateMany(
      { _id: { $in: ids as never } },
      { $set: { status: 'published', publishedAt: new Date() } }
    );
  }

  async incrementAttempts(id: string, errorMessage: string): Promise<void> {
    const collection = await this.collection();
    await collection.updateOne({ _id: id as never }, { $set: { errorMessage }, $inc: { attempts: 1 } });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: id as never },
      { $set: { status: 'failed', errorMessage }, $inc: { attempts: 1 } }
    );
  }
}
