import { describe, it, expect, beforeEach } from 'vitest';

describe('HealthStatus', () => {
  // Re-import the singleton fresh for each test using a dynamic import with cache-busting
  // is not straightforward with ESM singletons, so we manipulate via its public API instead.
  let healthStatus: Awaited<typeof import('../../../../../src/Contexts/Shared/infrastructure/health.js')>['default'];

  beforeEach(async () => {
    // Each test gets the same singleton; reset to known good state first
    const mod = await import('../../../../../src/Contexts/Shared/infrastructure/health.js');
    healthStatus = mod.default;
    healthStatus.setPrismaHealth('OK');
    healthStatus.setRabbitHealth('OK');
  });

  it('is healthy when both Prisma and Rabbit are OK', () => {
    expect(healthStatus.isHealth()).toBe(true);
    expect(healthStatus.isUnhealthy()).toBe(false);
  });

  it('is unhealthy when Prisma is KO', () => {
    healthStatus.setPrismaHealth('KO');
    expect(healthStatus.isHealth()).toBe(false);
    expect(healthStatus.isUnhealthy()).toBe(true);
  });

  it('is unhealthy when Rabbit is KO', () => {
    healthStatus.setRabbitHealth('KO');
    expect(healthStatus.isHealth()).toBe(false);
    expect(healthStatus.isUnhealthy()).toBe(true);
  });

  it('is unhealthy when both are KO', () => {
    healthStatus.setPrismaHealth('KO');
    healthStatus.setRabbitHealth('KO');
    expect(healthStatus.isHealth()).toBe(false);
  });

  it('recovers health when both are reset to OK', () => {
    healthStatus.setPrismaHealth('KO');
    healthStatus.setRabbitHealth('KO');
    healthStatus.setPrismaHealth('OK');
    healthStatus.setRabbitHealth('OK');
    expect(healthStatus.isHealth()).toBe(true);
  });
});
