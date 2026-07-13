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
      'songInstrument',
      'songInstrumentUpload',
      'song',
      'bandMember',
      'band',
      'musician',
      'user'
    ];

    for (const model of deletionOrder) {
      try {
        // @ts-expect-error We dynamically access models which isn't perfectly typed
        await this.client[model].deleteMany({});
      } catch (error) {
        // Ignore errors if the property is not a model or deleteMany is not a function
        // eslint-disable-next-line no-console
        console.debug(`Skipping ${model} cleanup:`, error instanceof Error ? error.message : error);
      }
    }
  }

  public async close(): Promise<void> {
    await this.client.$disconnect();
  }
}
