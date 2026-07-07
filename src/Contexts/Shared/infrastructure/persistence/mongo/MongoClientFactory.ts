import { MongoClient } from 'mongodb';
import util from 'util';
import { Nullable } from '../../../domain/Nullable.js';
import MongoConfig from './MongoConfig.js';
import Logger from '../../../domain/Logger.js';
import healthStatus from '../../health.js';

export class MongoClientFactory {
  private static clients: Record<string, MongoClient> = {};

  static async createClient(contextName: string, config: MongoConfig, logger: Logger): Promise<MongoClient> {
    const key = `${contextName}-${config.uri}`;
    let client = MongoClientFactory.getClient(key);

    if (!client) {
      client = await MongoClientFactory.createAndConnectClient(config, logger);

      MongoClientFactory.registerClient(client, key);
    }

    return client;
  }

  private static getClient(contextName: string): Nullable<MongoClient> {
    return MongoClientFactory.clients[contextName];
  }

  private static async createAndConnectClient(config: MongoConfig, logger: Logger): Promise<MongoClient> {
    const uri = util.format(config.uri, config.user, config.pass);
    const client = new MongoClient(uri, { ignoreUndefined: true, maxPoolSize: config.maxPoolSize });

    client.addListener('connectionPoolCreated', () => {
      logger.info(`Connected to Database <MongoDB>: ${config.uri}`);
    });

    client.addListener('serverHeartbeatFailed', async (event) => {
      logger.warn(event.failure?.message, 'Database <MongoDB> hearthbeat failed');
      healthStatus.setMongoHealth('KO');
    });

    client.addListener('serverHeartbeatSucceeded', async () => {
      if (!healthStatus.isHealth()) {
        logger.warn('Database <MongoDB> reconnected.');
      }
      healthStatus.setMongoHealth('OK');
    });

    await client.connect();

    return client;
  }

  private static registerClient(client: MongoClient, contextName: string): void {
    MongoClientFactory.clients[contextName] = client;
  }
}
