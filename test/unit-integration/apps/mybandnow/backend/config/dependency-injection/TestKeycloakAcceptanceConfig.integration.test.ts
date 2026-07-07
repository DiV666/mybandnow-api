import { describe, expect, it } from 'vitest';
import KeycloakConfig from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfig.js';
import { TestContainerFactory } from '@Test/apps/mybandnow/backend/config/dependency-injection/TestContainerFactory.js';
import { testKeycloakRealm } from '../../../../../../utils/keycloak/TestKeycloak.js';

describe('Acceptance Keycloak config registration', () => {
  it('uses the exact same testing realm in acceptance DI and the KeycloakEnvironmentArranger', async () => {
    const container = TestContainerFactory.create();

    const acceptanceKeycloakConfig = container.get('Apps.Mybandnow.Backend.KeyCloakConfig') as KeycloakConfig;
    const keycloakEnvironmentArranger = (await Promise.resolve(
      container.get('Shared.KeycloakEnvironmentArranger')
    )) as unknown as { config: KeycloakConfig };

    expect(acceptanceKeycloakConfig.realm).toBe(testKeycloakRealm());
    expect(keycloakEnvironmentArranger.config.realm).toBe(acceptanceKeycloakConfig.realm);
  });
});
