import MongoConfig from '@Contexts/Shared/infrastructure/persistence/mongo/MongoConfig.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export class MongoConfigFactory {
  static createConfig(): MongoConfig {
    return {
      uri: env.MONGO_URI,
      user: env.MONGO_USER,
      pass: env.MONGO_PASS,
      maxPoolSize: 50
    };
  }

  static createAnalyticsConfig(): MongoConfig {
    return {
      uri: env.MONGO_ANALYTICS_URI ?? env.MONGO_URI,
      user: env.MONGO_ANALYTICS_USER ?? env.MONGO_USER,
      pass: env.MONGO_ANALYTICS_PASS ?? env.MONGO_PASS,
      maxPoolSize: 10
    };
  }
}
