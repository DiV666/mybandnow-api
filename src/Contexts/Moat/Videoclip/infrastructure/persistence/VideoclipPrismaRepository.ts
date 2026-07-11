import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { PrismaClient } from '@prisma/client';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Videoclip } from '../../domain/Videoclip.js';
import { VideoclipPersistenceRepository } from '../../domain/repository/VideoclipPersistenceRepository.js';
import { VideoclipId } from '../../domain/value-object/VideoclipId.js';

export class VideoclipPrismaRepository implements VideoclipPersistenceRepository {
  private client: PrismaClient = PrismaClientFactory.createClient();

  public async save(videoclip: Videoclip): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...primitives } = videoclip.toPrimitives();

    await this.client.videoclip.upsert({
      where: { id: videoclip.id.value },
      update: primitives,
      create: primitives
    });
  }

  public async search(id: VideoclipId): Promise<Nullable<Videoclip>> {
    const document = await this.client.videoclip.findUnique({
      where: { id: id.value }
    });

    if (!document) return null;

    return Videoclip.fromPrimitives({
      ...document,
      createdAt: document.createdAt.toISOString()
    });
  }
}
