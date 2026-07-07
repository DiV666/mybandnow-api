import { describe, expect, it } from 'vitest';
import {
  TESTING_KEYCLOAK_REALM_SUFFIX,
  testKeycloakConfig,
  testKeycloakRealm,
  testKeycloakTokenUrl
} from '../../../utils/keycloak/TestKeycloak.js';

describe('TestKeycloak helper', () => {
  it('builds the testing realm from KEYCLOAK_REALM with the shared suffix', () => {
    expect(TESTING_KEYCLOAK_REALM_SUFFIX).toBe('-testing');
    expect(testKeycloakRealm()).toBe(`${process.env.KEYCLOAK_REALM}${TESTING_KEYCLOAK_REALM_SUFFIX}`);
  });

  it('builds the testing Keycloak config from env', () => {
    expect(testKeycloakConfig()).toEqual({
      origin: process.env.KEYCLOAK_ORIGIN,
      realm: testKeycloakRealm(),
      audience: process.env.KEYCLOAK_AUDIENCE ?? 'account'
    });
  });

  it('builds the testing token URL from the shared testing config', () => {
    expect(testKeycloakTokenUrl()).toBe(
      `${process.env.KEYCLOAK_ORIGIN}/realms/${testKeycloakRealm()}/protocol/openid-connect/token`
    );
  });
});
