import { UserPersistenceRepository } from '../../domain/repository/UserPersistenceRepository.js';
import { User } from '../../domain/User.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { PrismaCriteriaConverter } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaCriteriaConverter.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';

export class UserPrismaRepository implements UserPersistenceRepository {
  private client = PrismaClientFactory.createClient();
  private converter = new PrismaCriteriaConverter();

  constructor(private readonly outbox: Outbox) {}

  async matching(criteria: Criteria): Promise<User[]> {
    const query = this.converter.convert(criteria);
    const documents = await this.client.user.findMany(query);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return documents.map((doc: any) => User.fromPrimitives(doc));
  }

  async matchingCount(criteria: Criteria): Promise<number> {
    const query = this.converter.convert(criteria);
    return this.client.user.count({ where: query.where });
  }

  async save(user: User): Promise<void> {
    const data = user.toPrimitives();

    // Peek at domain events without clearing them so the use case can still publish to EventBus
    const events = user.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: data.id },
        update: data,
        create: data
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }
}
