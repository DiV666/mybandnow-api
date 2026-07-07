import KeycloakConfig from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfig.js';

export const TESTING_KEYCLOAK_REALM_SUFFIX = '-testing';

export function testKeycloakRealm(realm = process.env.KEYCLOAK_REALM): string {
  if (!realm) {
    throw new Error('KEYCLOAK_REALM is required to build the testing Keycloak realm');
  }

  return `${realm}${TESTING_KEYCLOAK_REALM_SUFFIX}`;
}

export function testKeycloakClientId(): string {
  return 'test';
}

export function testKeycloakAudience(): string {
  return process.env.KEYCLOAK_AUDIENCE ?? 'account';
}

export function testKeycloakConfig(
  origin = process.env.KEYCLOAK_ORIGIN,
  realm = process.env.KEYCLOAK_REALM
): KeycloakConfig {
  if (!origin) {
    throw new Error('KEYCLOAK_ORIGIN is required to build the testing Keycloak config');
  }

  return {
    origin,
    realm: testKeycloakRealm(realm),
    audience: testKeycloakAudience()
  };
}

export function testKeycloakTokenUrl(config: KeycloakConfig = testKeycloakConfig()): string {
  return `${config.origin}/realms/${config.realm}/protocol/openid-connect/token`;
}

export class TestKeycloakConfigFactory {
  static createConfig(): KeycloakConfig {
    return testKeycloakConfig();
  }
}
