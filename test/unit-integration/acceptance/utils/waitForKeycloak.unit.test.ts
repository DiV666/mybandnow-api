import { describe, expect, it, vi } from 'vitest';
import { waitForKeycloak } from '../../../acceptance/utils/waitForKeycloak.js';

describe('waitForKeycloak', () => {
  it('retries until Keycloak responds', async () => {
    const probe = vi
      .fn<(url: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error('not ready yet'))
      .mockRejectedValueOnce(new Error('still booting'))
      .mockResolvedValueOnce(undefined);

    await expect(
      waitForKeycloak({
        // eslint-disable-next-line sonarjs/no-clear-text-protocols -- test environment uses local http
        origin: 'http://keycloak:8080',
        timeoutMs: 50,
        intervalMs: 1,
        probe
      })
    ).resolves.toBeUndefined();

    expect(probe).toHaveBeenCalledTimes(3);
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- test environment uses local http
    expect(probe).toHaveBeenLastCalledWith('http://keycloak:8080/realms/master/.well-known/openid-configuration');
  });

  it('fails with a clear timeout error when Keycloak never responds', async () => {
    const probe = vi.fn<(url: string) => Promise<void>>().mockRejectedValue(new Error('connection refused'));

    await expect(
      waitForKeycloak({
        // eslint-disable-next-line sonarjs/no-clear-text-protocols -- test environment uses local http
        origin: 'http://keycloak:8080',
        timeoutMs: 10,
        intervalMs: 1,
        probe
      })
    ).rejects.toThrow(
      'Timed out waiting for Keycloak readiness at http://keycloak:8080/realms/master/.well-known/openid-configuration after 10ms'
    );

    expect(probe).toHaveBeenCalled();
  });
});
