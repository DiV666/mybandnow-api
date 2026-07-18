import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { PrismaCriteriaConverter } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaCriteriaConverter.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Instruments } from '../../domain/Instruments.js';
import { InstrumentsPersistenceRepository } from '../../domain/repository/InstrumentsPersistenceRepository.js';
import { InstrumentsId } from '../../domain/value-object/InstrumentsId.js';

export class InstrumentsPrismaRepository implements InstrumentsPersistenceRepository {
  private client = PrismaClientFactory.createClient();
  private converter = new PrismaCriteriaConverter();

  constructor(private readonly outbox: Outbox) {}

  async search(id: InstrumentsId): Promise<Nullable<Instruments>> {
    const document = await this.client.instruments.findUnique({
      where: { id: id.value }
    });

    if (!document) {
      return null;
    }

    return Instruments.fromPrimitives(document as Parameters<typeof Instruments.fromPrimitives>[0]);
  }

  async matching(criteria: Criteria): Promise<Array<Instruments>> {
    const prismaQuery = this.converter.convert(criteria);
    const documents = await this.client.instruments.findMany(prismaQuery);

    return documents.map((document) =>
      Instruments.fromPrimitives(document as Parameters<typeof Instruments.fromPrimitives>[0])
    );
  }

  async matchingCount(criteria: Criteria): Promise<number> {
    const prismaQuery = this.converter.convert(criteria);

    return this.client.instruments.count({ where: prismaQuery.where });
  }

  async save(model: Instruments): Promise<void> {
    const primitives = model.toPrimitives();
    const events = model.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.instruments.upsert({
        where: { id: primitives.id },
        update: {
          name: primitives.name,
          description: primitives.description
        },
        create: {
          id: primitives.id,
          name: primitives.name,
          description: primitives.description,
          createdAt: primitives.createdAt
        }
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }
}
