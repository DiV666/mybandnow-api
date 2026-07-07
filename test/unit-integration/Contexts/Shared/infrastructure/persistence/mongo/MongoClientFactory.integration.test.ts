import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoClient } from 'mongodb';
import { mock } from 'vitest-mock-extended';
import { MongoClientFactory } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoClientFactory.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import healthStatus from '../../../../../../../src/Contexts/Shared/infrastructure/health.js';

describe('MongoClientFactory', () => {
  describe('#createClient', () => {
    const factory = MongoClientFactory;
    const logger = mock<Logger>();
    let mongoClient: MongoClient;

    beforeEach(async () => {
      mongoClient = await factory.createClient(
        'test',
        {
          uri: process.env.MONGO_URI as string,
          user: process.env.MONGO_USER as string,
          pass: process.env.MONGO_PASS as string,
          maxPoolSize: 10
        },
        logger
      );
    });

    afterEach(async () => {
      await mongoClient.close();
      // Remove only the keys this test created so closed clients don't leak
      // into other test files. Clearing the full cache would break test files
      // that hold references to their own MongoClient instances.
      const cache = (MongoClientFactory as unknown as { clients: Record<string, MongoClient> }).clients;
      const keysToRemove = Object.keys(cache).filter((k) => k.startsWith('test-') || k.startsWith('test2-'));
      keysToRemove.forEach((k) => delete cache[k]);
    });

    it('creates a new client with the connection already established', () => {
      expect(mongoClient).toBeInstanceOf(MongoClient);
    });

    it('creates a new client if it does not exist a client with the given name', async () => {
      const newMongoClient = await factory.createClient(
        'test2',
        {
          uri: process.env.MONGO_URI as string,
          user: process.env.MONGO_USER as string,
          pass: process.env.MONGO_PASS as string,
          maxPoolSize: 10
        },
        logger
      );

      expect(newMongoClient).not.toBe(mongoClient);

      await newMongoClient.close();
    });

    it('returns a client if it already exists', async () => {
      const newMongoClient = await factory.createClient(
        'test',
        {
          uri: process.env.MONGO_URI as string,
          user: process.env.MONGO_USER as string,
          pass: process.env.MONGO_PASS as string,
          maxPoolSize: 10
        },
        logger
      );

      expect(newMongoClient).toBe(mongoClient);

      await newMongoClient.close();
    });

    it('marks Mongo as unhealthy on a failed heartbeat and healthy again once it recovers', () => {
      // Arrange
      healthStatus.setMongoHealth('OK');

      // Act
      mongoClient.emit('serverHeartbeatFailed', { failure: { message: 'timeout' } } as never);

      // Assert
      expect(healthStatus.isHealth()).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith('timeout', 'Database <MongoDB> hearthbeat failed');

      // Act
      mongoClient.emit('serverHeartbeatSucceeded', {} as never);

      // Assert
      expect(healthStatus.isHealth()).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith('Database <MongoDB> reconnected.');
    });
  });
});
