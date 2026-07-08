import MongoConfig from '@Contexts/Shared/infrastructure/persistence/mongo/MongoConfig.js';

export class MongoConfigFactory {
  static createConfig(): MongoConfig {
    return {
      uri: process.env.MONGO_URI || '',
      user: process.env.MONGO_USER || '',
      pass: process.env.MONGO_PASS || '',
      maxPoolSize: 50
    };
  }

  static createAnalyticsConfig(): MongoConfig {
    return {
      uri: process.env.MONGO_ANALYTICS_URI || process.env.MONGO_URI || '',
      user: process.env.MONGO_ANALYTICS_USER || process.env.MONGO_USER || '',
      pass: process.env.MONGO_ANALYTICS_PASS || process.env.MONGO_PASS || '',
      maxPoolSize: 10
    };
  }
}
