import { TrackPersistenceRepository } from '../../domain/repository/TrackPersistenceRepository.js';
import { Track } from '../../domain/Track.js';
import { TrackId } from '../../domain/value-object/TrackId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';

export class TrackPrismaRepository implements TrackPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  async save(track: Track): Promise<void> {
    const data = track.toPrimitives();
    const events = track.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.track.upsert({
        where: { id: data.id },
        update: {
          songId: data.songId,
          instrumentName: data.instrumentName,
          status: data.status,
          createdAt: data.createdAt
        },
        create: {
          id: data.id,
          songId: data.songId,
          instrumentName: data.instrumentName,
          status: data.status,
          createdAt: data.createdAt
        }
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }

  async search(id: TrackId): Promise<Nullable<Track>> {
    const trackData = await this.client.track.findUnique({
      where: { id: id.value }
    });

    if (!trackData) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Track.fromPrimitives(trackData as any);
  }

  async remove(id: TrackId): Promise<void> {
    await this.client.track.delete({
      where: { id: id.value }
    });
  }
}
