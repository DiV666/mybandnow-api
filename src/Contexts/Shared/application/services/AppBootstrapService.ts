import type { HealthChecker } from '../../domain/HealthChecker.js';

/**
 * Application service that provides infrastructure dependencies to the Apps layer
 * without violating hexagonal architecture rules (apps/ imports application/ only).
 */
export class AppBootstrapService {
  constructor(
    private readonly healthChecker: HealthChecker,
    private readonly sentryDsn: string | undefined,
    private readonly nodeEnv: string,
    private readonly npmPackageVersion: string
  ) {}

  getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }

  getSentryConfig(): { dsn: string; environment: string; release: string } | null {
    if (!this.sentryDsn) {
      return null;
    }
    return {
      dsn: this.sentryDsn,
      environment: this.nodeEnv,
      release: `mybandnow-api@${this.npmPackageVersion}`
    };
  }
}
