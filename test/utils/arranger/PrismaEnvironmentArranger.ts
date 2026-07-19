import { PrismaClient } from '@prisma/client';
import { EnvironmentArranger } from './EnvironmentArranger.js';
import { PrismaClientFactory } from '../../../src/Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

export class PrismaEnvironmentArranger extends EnvironmentArranger {
  private client: PrismaClient;

  constructor() {
    super();
    this.client = PrismaClientFactory.createClient();
  }

  public async arrange(): Promise<void> {
    await this.clean();
  }

  public async clean(): Promise<void> {
    const deletionOrder = [
      'outbox',
      'domainEventFailover',
      'videoclipProcess',
      'songInstrumentProcess',
      'videoclip',
      'songInstrumentVideo',
      'songInstrumentUpload',
      'songInstrument',
      'song',
      'bandMember',
      'band',
      'musician',
      'user'
    ] as const;

    for (const model of deletionOrder) {
      const delegate = this.resolveDeleteManyDelegate(model);

      if (!delegate) {
        continue;
      }

      await delegate.deleteMany({});
    }
  }

  private resolveDeleteManyDelegate(model: string): { deleteMany: (args: object) => Promise<unknown> } | null {
    const candidate = (this.client as unknown as Record<string, unknown>)[model];

    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      !('deleteMany' in candidate) ||
      typeof candidate.deleteMany !== 'function'
    ) {
      return null;
    }

    return candidate as { deleteMany: (args: object) => Promise<unknown> };
  }

  public async close(): Promise<void> {
    await this.client.$disconnect();
  }
}
