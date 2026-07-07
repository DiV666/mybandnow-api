import { describe, it, expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { AppBootstrapService } from '../../../../../../src/Contexts/Shared/application/services/AppBootstrapService.js';
import { HealthChecker } from '../../../../../../src/Contexts/Shared/domain/HealthChecker.js';

describe('AppBootstrapService', () => {
  let healthChecker: MockProxy<HealthChecker>;

  describe('#getHealthChecker', () => {
    it('returns the injected health checker instance', () => {
      healthChecker = mock<HealthChecker>();
      const service = new AppBootstrapService(healthChecker, undefined, 'test', '1.0.0');

      const result = service.getHealthChecker();

      expect(result).toBe(healthChecker);
    });
  });

  describe('#getSentryConfig', () => {
    it('returns null when sentryDsn is undefined', () => {
      healthChecker = mock<HealthChecker>();
      const service = new AppBootstrapService(healthChecker, undefined, 'production', '1.2.3');

      const result = service.getSentryConfig();

      expect(result).toBeNull();
    });

    it('returns the dsn, environment and release when sentryDsn is set', () => {
      healthChecker = mock<HealthChecker>();
      const service = new AppBootstrapService(healthChecker, 'https://sentry.example/dsn', 'production', '1.2.3');

      const result = service.getSentryConfig();

      expect(result).toEqual({
        dsn: 'https://sentry.example/dsn',
        environment: 'production',
        release: 'mybandnow-api@1.2.3'
      });
    });
  });
});
