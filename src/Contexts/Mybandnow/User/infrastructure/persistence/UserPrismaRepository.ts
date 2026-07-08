import { PrismaClientFactory } from '../../../../Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { UserPersistenceRepository } from '../../domain/repository/UserPersistenceRepository.js';
import { User } from '../../domain/User.js';
import { Criteria } from '../../../../Shared/domain/criteria/Criteria.js';

export class UserPrismaRepository implements UserPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  private converter = new PrismaCriteriaConverter();

  async matching(criteria: Criteria): Promise<User[]> {
    const query = this.converter.convert(criteria);
    const documents = await this.client.user.findMany(query);
    return documents.map((doc: any) => User.fromPrimitives(doc));
  }

  async matchingCount(criteria: Criteria): Promise<number> {
    const query = this.converter.convert(criteria);
    return this.client.user.count({ where: query.where });
  }

  async save(user: User): Promise<void> {
    const data = user.toPrimitives();
    await this.client.user.upsert({
      where: { id: data.id },
      update: data,
      create: data
    });
    // TODO: Integrate with Prisma transactional Outbox
  }
}
