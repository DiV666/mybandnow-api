import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { Band } from '../../domain/Band.js';
import { BandId } from '../../domain/value-object/BandId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { BandMemberRoleType } from '../../domain/value-object/BandMemberRole.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { PrismaCriteriaConverter } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaCriteriaConverter.js';

export class BandPrismaRepository implements BandPersistenceRepository {
  private client = PrismaClientFactory.createClient();
  private converter = new PrismaCriteriaConverter();

  constructor(private readonly outbox: Outbox) {}

  async save(band: Band): Promise<void> {
    const data = band.toPrimitives();

    // Peek at domain events without clearing them so the use case can still publish to EventBus
    const events = band.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.band.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          ownerId: data.ownerId
        },
        create: {
          id: data.id,
          name: data.name,
          ownerId: data.ownerId,
          createdAt: data.createdAt
        }
      });

      await tx.bandMember.deleteMany({
        where: { bandId: data.id }
      });

      if (data.members.length > 0) {
        await tx.bandMember.createMany({
          data: data.members.map((member) => ({
            id: member.id,
            role: member.role,
            musicianId: member.musicianId,
            bandId: data.id
          }))
        });
      }

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }

  async search(id: BandId): Promise<Nullable<Band>> {
    const bandData = await this.client.band.findUnique({
      where: { id: id.value },
      include: { members: true }
    });

    if (!bandData) {
      return null;
    }

    return Band.fromPrimitives({
      id: bandData.id,
      name: bandData.name,
      ownerId: bandData.ownerId,
      members: bandData.members.map((member) => ({
        id: member.id,
        musicianId: member.musicianId,
        role: member.role as BandMemberRoleType
      })),
      createdAt: bandData.createdAt
    });
  }

  async matching(criteria: Criteria): Promise<Array<Band>> {
    const prismaQuery = this.converter.convert(criteria);

    if (prismaQuery.where?.userId) {
      prismaQuery.where.members = {
        some: {
          musician: {
            userId: prismaQuery.where.userId
          }
        }
      };
      delete prismaQuery.where.userId;
    }

    const bandsData = await this.client.band.findMany({
      ...prismaQuery,
      include: { members: true }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bandsData.map((bandData: any) =>
      Band.fromPrimitives({
        id: bandData.id,
        name: bandData.name,
        ownerId: bandData.ownerId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        members: bandData.members.map((member: any) => ({
          id: member.id,
          musicianId: member.musicianId,
          role: member.role as BandMemberRoleType
        })),
        createdAt: bandData.createdAt
      })
    );
  }

  async matchingCount(criteria: Criteria): Promise<number> {
    const prismaQuery = this.converter.convert(criteria);

    if (prismaQuery.where?.userId) {
      prismaQuery.where.members = {
        some: {
          musician: {
            userId: prismaQuery.where.userId
          }
        }
      };
      delete prismaQuery.where.userId;
    }

    return this.client.band.count({ where: prismaQuery.where });
  }

  async remove(band: Band): Promise<void> {
    const events = band.pullDomainEvents({ drain: false });
    const data = band.toPrimitives();

    await this.client.$transaction(async (tx) => {
      await tx.bandMember.deleteMany({
        where: { bandId: data.id }
      });

      await tx.band.delete({
        where: { id: data.id }
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }
}
