import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export class PrismaClientFactory {
  private static client: PrismaClient | null = null;
  private static pool: Pool | null = null;

  static createClient(): PrismaClient {
    if (!PrismaClientFactory.client) {
      const connectionString = process.env.DATABASE_URL;
      
      if (!PrismaClientFactory.pool) {
        PrismaClientFactory.pool = new Pool({ connectionString });
      }
      
      const adapter = new PrismaPg(PrismaClientFactory.pool);
      PrismaClientFactory.client = new PrismaClient({ adapter });
    }
    return PrismaClientFactory.client;
  }
}
