import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import jsonwebtoken, { JwtHeader } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { KeycloakBearerToken } from '../../../../../../../src/Contexts/Mybandnow/Shared/infrastructure/identityServer/keycloak/KeycloakBearerToken.js';
import { testKeycloakConfig } from '../../../../../../utils/keycloak/TestKeycloak.js';

// Mock de las librerías externas
vi.mock('jsonwebtoken');
vi.mock('jwks-rsa');

describe('KeycloakBearerToken', () => {
  let keycloakBearerToken: KeycloakBearerToken;
  const keycloakConfig = testKeycloakConfig();

  const mockVerify = jsonwebtoken.verify as Mock;
  const mockGetSigningKey = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock de la implementación de jwks-rsa
    vi.mocked(jwksClient).mockImplementation(
      () =>
        ({
          getSigningKey: mockGetSigningKey
        }) as unknown as jwksClient.JwksClient
    );

    keycloakBearerToken = new KeycloakBearerToken(keycloakConfig, 'test');
  });

  it('should verifyJWT successfully if token is valid and has required scopes', async () => {
    const token = 'valid-token';
    const requiredScopes = ['user:read'];
    const decodedPayload = {
      sub: 'user-id-123',
      aud: [keycloakConfig.audience],
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    const result = await keycloakBearerToken.verifyJWT(token, requiredScopes);

    expect(result.userId).toBe('user-id-123');
    expect(result.realm_access?.roles).toContain('user:read');
  });

  it('should accept a token whose aud array contains the configured audience among others', async () => {
    const token = 'valid-token';
    const decodedPayload = {
      sub: 'user-id-123',
      aud: ['another-service', keycloakConfig.audience],
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    await expect(keycloakBearerToken.verifyJWT(token, [])).resolves.toBeDefined();
  });

  it('should accept a token whose aud is the configured audience as a plain string', async () => {
    const token = 'valid-token';
    const decodedPayload = {
      sub: 'user-id-123',
      aud: keycloakConfig.audience,
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    await expect(keycloakBearerToken.verifyJWT(token, [])).resolves.toBeDefined();
  });

  it('should throw UnauthorizedException if aud is present but does not contain the configured audience', async () => {
    const token = 'valid-token';
    const decodedPayload = {
      sub: 'user-id-123',
      aud: ['another-service'],
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token audience validation failed.'
    });
  });

  it('should throw UnauthorizedException if aud is missing', async () => {
    const token = 'valid-token';
    const decodedPayload = {
      sub: 'user-id-123',
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token audience validation failed.'
    });
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    const token = 'invalid-token';
    const requiredScopes = ['user:read'];
    const verificationError = new Error('Invalid signature');

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(verificationError, null);
    });

    // Implementation wraps all jwt errors into a generic 'Token verification failed.' message
    // The original error travels in the cause for the central auth handler to log.
    await expect(keycloakBearerToken.verifyJWT(token, requiredScopes)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token verification failed.',
      cause: verificationError
    });
  });

  it('should throw ForbiddenException if user does not have required scopes', async () => {
    const token = 'valid-token';
    const requiredScopes = ['user:delete'];
    const decodedPayload = {
      sub: 'user-id-123',
      aud: [keycloakConfig.audience],
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    await expect(keycloakBearerToken.verifyJWT(token, requiredScopes)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Insufficient permissions.',
      cause: 'User does not have required roles: user:delete'
    });
  });

  it('should succeed if endpoint requires no specific scopes', async () => {
    const token = 'valid-token';
    const requiredScopes: string[] = []; // Endpoint público o sin scopes definidos
    const decodedPayload = {
      sub: 'user-id-123',
      aud: [keycloakConfig.audience],
      realm_access: {
        roles: ['user:read']
      }
    };

    mockVerify.mockImplementation((_token, _getKey, _options, callback) => {
      callback(null, decodedPayload);
    });

    await expect(keycloakBearerToken.verifyJWT(token, requiredScopes)).resolves.toBeDefined();
  });

  it('should throw UnauthorizedException if authorization header is not provided', async () => {
    const token = '';
    // Implementation throws generic 'Missing or empty token' when token is empty
    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Missing or empty token'
    });
  });

  it('should throw UnauthorizedException if token is malformed (missing kid)', async () => {
    const token = 'token-bad-kid';

    mockVerify.mockImplementation((_token, getKey, _options, callback) => {
      // Simulate jsonwebtoken calling our getKey function without a 'kid' in the header
      const headerWithoutKid: JwtHeader = { alg: 'RS256' };
      getKey(headerWithoutKid, (err: Error | null) => {
        callback(err, null);
      });
    });

    // getKey propagates the error back through jsonwebtoken, which wraps it in 'Token verification failed.'
    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token verification failed.'
    });
  });

  it('should throw UnauthorizedException if signing key cannot be retrieved', async () => {
    const token = 'valid-token-with-kid';
    const getKeyError = new Error('Failed to get key from JWKS');

    mockGetSigningKey.mockImplementation((_kid, callback) => {
      callback(getKeyError, null);
    });

    mockVerify.mockImplementation((_token, getKey, _options, callback) => {
      const headerWithKid: JwtHeader = { alg: 'RS256', kid: 'some-kid' };
      getKey(headerWithKid, (err: Error | null) => {
        callback(err, null);
      });
    });

    // getKey propagates the error back through jsonwebtoken, which wraps it in 'Token verification failed.'
    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token verification failed.'
    });
  });

  it('should throw UnauthorizedException if signing key is not found (no error, but no key neither)', async () => {
    const token = 'valid-token-with-kid';

    mockGetSigningKey.mockImplementation((_kid, callback) => {
      callback(null, null); // No error, but NO key either
    });

    mockVerify.mockImplementation((_token, getKey, _options, callback) => {
      const headerWithKid: JwtHeader = { alg: 'RS256', kid: 'some-kid' };
      getKey(headerWithKid, (err: Error | null) => {
        callback(err, null);
      });
    });

    await expect(keycloakBearerToken.verifyJWT(token, [])).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Token verification failed.'
    });
  });

  // Test removed: Bearer token extraction is now handled in server.ts middleware, not in KeycloakBearerToken

  it('should successfully verify JWT when signing key is retrieved from JWKS', async () => {
    const token = 'valid-token-with-kid';
    const requiredScopes = ['user:read'];
    const decodedPayload = {
      sub: 'user-id-123',
      aud: [keycloakConfig.audience],
      realm_access: {
        roles: ['user:read']
      }
    };

    mockGetSigningKey.mockImplementation((_kid, callback) => {
      callback(null, { getPublicKey: () => 'the-public-key' });
    });

    mockVerify.mockImplementation((_token, getKey, _options, callback) => {
      const headerWithKid: JwtHeader = { alg: 'RS256', kid: 'some-kid' };
      getKey(headerWithKid, (err: Error | null) => {
        if (!err) {
          callback(null, decodedPayload);
        } else {
          callback(err, null);
        }
      });
    });

    const result = await keycloakBearerToken.verifyJWT(token, requiredScopes);

    expect(result.userId).toBe('user-id-123');
    expect(result.realm_access?.roles).toContain('user:read');
    expect(mockGetSigningKey).toHaveBeenCalledWith('some-kid', expect.any(Function));
  });

  // Test removed: Request context validation is now handled in server.ts middleware, not in KeycloakBearerToken
});
