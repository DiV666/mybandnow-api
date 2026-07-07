import { generateKeyPairSync } from 'node:crypto';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import jsonwebtoken from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { KeycloakBearerToken } from '../../../../../../../src/Contexts/Mybandnow/Shared/infrastructure/identityServer/keycloak/KeycloakBearerToken.js';
import type KeycloakConfig from '../../../../../../../src/Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfig.js';

// Only the JWKS client is mocked: signature verification must use the REAL jsonwebtoken
// implementation so the pinned-key security property is actually exercised.
vi.mock('jwks-rsa');

function generateRsaKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return { publicKey, privateKey };
}

describe('KeycloakBearerToken with pinned public key', () => {
  const origin = 'http://keycloak.test';
  const realm = 'kloding-testing';
  const audience = 'account';
  const issuer = `${origin}/realms/${realm}`;

  const pinnedKeyPair = generateRsaKeyPair();
  const untrustedKeyPair = generateRsaKeyPair();

  let keycloakBearerToken: KeycloakBearerToken;
  const mockGetSigningKey = vi.fn();

  const pinnedConfig: KeycloakConfig = {
    origin,
    realm,
    audience,
    pinnedPublicKey: pinnedKeyPair.publicKey
  };

  function signToken(privateKey: string, payload: Record<string, unknown> = {}): string {
    return jsonwebtoken.sign(
      {
        aud: audience,
        realm_access: { roles: ['user:read'] },
        ...payload
      },
      privateKey,
      {
        algorithm: 'RS256',
        issuer,
        subject: 'user-id-123',
        expiresIn: '1h',
        keyid: 'some-kid'
      }
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(jwksClient).mockImplementation(
      () =>
        ({
          getSigningKey: mockGetSigningKey
        }) as unknown as jwksClient.JwksClient
    );

    keycloakBearerToken = new KeycloakBearerToken(pinnedConfig, 'test');
  });

  it('should accept a token signed with the pinned key without querying JWKS', async () => {
    // Arrange
    const token = signToken(pinnedKeyPair.privateKey);

    // Act
    const result = await keycloakBearerToken.verifyJWT(token, ['user:read']);

    // Assert
    expect(result.userId).toBe('user-id-123');
    expect(result.realm_access?.roles).toContain('user:read');
    expect(mockGetSigningKey).not.toHaveBeenCalled();
  });

  it('should reject a token signed with a different key even if issuer and kid look valid', async () => {
    // Arrange
    const token = signToken(untrustedKeyPair.privateKey);

    // Act & Assert
    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token verification failed.'
    });
    expect(mockGetSigningKey).not.toHaveBeenCalled();
  });

  it('should reject a token signed with the pinned key but a wrong issuer', async () => {
    // Arrange
    const token = jsonwebtoken.sign({ aud: audience, realm_access: { roles: [] } }, pinnedKeyPair.privateKey, {
      algorithm: 'RS256',
      issuer: 'http://evil.test/realms/other',
      subject: 'user-id-123',
      expiresIn: '1h'
    });

    // Act & Assert
    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token verification failed.'
    });
  });

  it('should reject a token signed with the pinned key whose aud does not include the configured audience', async () => {
    // Arrange
    const token = signToken(pinnedKeyPair.privateKey, { aud: 'another-service' });

    // Act & Assert
    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token audience validation failed.'
    });
  });

  it('should keep using the JWKS lookup when no pinned key is configured', async () => {
    // Arrange
    const jwksConfig: KeycloakConfig = { origin, realm, audience };
    const jwksBearerToken = new KeycloakBearerToken(jwksConfig, 'test');
    const token = signToken(pinnedKeyPair.privateKey);

    mockGetSigningKey.mockImplementation((_kid, callback) => {
      callback(null, { getPublicKey: () => pinnedKeyPair.publicKey });
    });

    // Act
    const result = await jwksBearerToken.verifyJWT(token, []);

    // Assert
    expect(result.userId).toBe('user-id-123');
    expect(mockGetSigningKey).toHaveBeenCalledWith('some-kid', expect.any(Function));
  });
});
