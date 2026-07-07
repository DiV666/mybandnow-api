import { describe, it, expect } from 'vitest';
import { MongoConfigFactory } from '../../../../../../../../src/Contexts/Mybandnow/Shared/infrastructure/persistence/mongo/MongoConfigFactory.js';

describe('MongoConfigFactory', () => {
  describe('#createConfig', () => {
    it('creates a config using MONGO_URI, MONGO_USER, MONGO_PASS env vars', () => {
      const config = MongoConfigFactory.createConfig();
      expect(config.uri).toBe(process.env.MONGO_URI);
      expect(config.user).toBe(process.env.MONGO_USER);
      expect(config.pass).toBe(process.env.MONGO_PASS);
    });

    it('sets a reasonable maxPoolSize', () => {
      const config = MongoConfigFactory.createConfig();
      expect(config.maxPoolSize).toBeGreaterThan(0);
    });
  });

  describe('#createAnalyticsConfig', () => {
    it('falls back to main MONGO_URI when MONGO_ANALYTICS_URI is not set', () => {
      const config = MongoConfigFactory.createAnalyticsConfig();
      // In test env, MONGO_ANALYTICS_URI is not set so it falls back
      expect(config.uri).toBe(process.env.MONGO_URI);
    });

    it('falls back to MONGO_USER when MONGO_ANALYTICS_USER is not set', () => {
      const config = MongoConfigFactory.createAnalyticsConfig();
      expect(config.user).toBe(process.env.MONGO_USER);
    });

    it('falls back to MONGO_PASS when MONGO_ANALYTICS_PASS is not set', () => {
      const config = MongoConfigFactory.createAnalyticsConfig();
      expect(config.pass).toBe(process.env.MONGO_PASS);
    });

    it('sets a maxPoolSize smaller than the main config', () => {
      const mainConfig = MongoConfigFactory.createConfig();
      const analyticsConfig = MongoConfigFactory.createAnalyticsConfig();
      expect(analyticsConfig.maxPoolSize).toBeLessThan(mainConfig.maxPoolSize);
    });
  });
});
