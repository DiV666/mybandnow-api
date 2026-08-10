import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const prisma = PrismaClientFactory.createClient();

describe('SongInstrumentUploadPrismaRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  it('should use SongInstrumentUpload as the physical table name', async () => {
    // Act
    const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'SongInstrumentUpload'
    `;

    // Assert
    expect(tables).toEqual([{ tableName: 'SongInstrumentUpload' }]);
  });
});
