import { vi, describe, it, expect, beforeEach } from 'vitest';
import jsonwebtoken from 'jsonwebtoken';
import { InternalAuthentication } from '../../../../../../../src/Contexts/Mybandnow/Shared/infrastructure/identityServer/internal/InternalAuthentication.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('InternalAuthentication', () => {
  let internalAuthentication: InternalAuthentication;
  let privateKey: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get keys from environment (loaded by docker-compose in integration tests)
    privateKey = Buffer.from(process.env.KLODING_INTERNAL_PRIVATE_KEY_BASE64 ?? '', 'base64').toString('utf8');
    const publicKey = Buffer.from(process.env.KLODING_INTERNAL_PUBLIC_KEY_BASE64 ?? '', 'base64').toString('utf8');

    internalAuthentication = new InternalAuthentication(publicKey);
  });

  it('should verify a valid internal JWT and return the claims', async () => {
    const payload = {
      userId: '11111111-1111-4111-8111-111111111111',
      companyId: '22222222-2222-4222-8222-222222222222',
      partnerId: '33333333-3333-4333-8333-333333333333'
    };

    // Generate a REAL JWT signed with the private key
    const validToken = jsonwebtoken.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h'
    });

    const result = await internalAuthentication.verifyJWT(validToken);

    expect(result).toStrictEqual({
      userId: payload.userId,
      companyId: payload.companyId,
      partnerId: payload.partnerId
    });
  });

  it('should throw ForbiddenException with the diagnostic in the cause when token is invalid', async () => {
    const thrownError = await internalAuthentication.verifyJWT('invalid.jwt.token').catch((error: unknown) => error);

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError).toHaveProperty('status', 403);

    if (thrownError instanceof Error && 'exception' in thrownError) {
      expect(thrownError.exception).toBeInstanceOf(ForbiddenException);
    }

    // Diagnostic detail travels in the cause, not in the client-facing body
    expect(thrownError).toHaveProperty('cause', expect.stringContaining('invalid token'));
  });

  it('should throw ForbiddenException when claims are incomplete', async () => {
    const incompletePayload = {
      userId: '11111111-1111-4111-8111-111111111111',
      companyId: '22222222-2222-4222-8222-222222222222'
      // Missing partnerId
    };

    // Generate a REAL JWT with incomplete claims
    const tokenWithIncompleteClaims = jsonwebtoken.sign(incompletePayload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h'
    });

    const thrownError = await internalAuthentication
      .verifyJWT(tokenWithIncompleteClaims)
      .catch((error: unknown) => error);

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError).toHaveProperty('status', 403);

    if (thrownError instanceof Error && 'exception' in thrownError) {
      expect(thrownError.exception).toBeInstanceOf(ForbiddenException);
    }

    expect(thrownError).toHaveProperty('cause', expect.stringContaining('claims are incomplete'));
  });

  it('should throw ForbiddenException when token is signed with wrong algorithm', async () => {
    const payload = {
      userId: '11111111-1111-4111-8111-111111111111',
      companyId: '22222222-2222-4222-8222-222222222222',
      partnerId: '33333333-3333-4333-8333-333333333333'
    };

    // Sign with HS256 (symmetric) instead of RS256 (asymmetric)
    const wrongSecret = Buffer.from('wrong-algorithm').toString('base64');
    const tokenWithWrongAlgorithm = jsonwebtoken.sign(payload, wrongSecret, {
      algorithm: 'HS256'
    });

    const thrownError = await internalAuthentication
      .verifyJWT(tokenWithWrongAlgorithm)
      .catch((error: unknown) => error);

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError).toHaveProperty('status', 403);

    if (thrownError instanceof Error && 'exception' in thrownError) {
      expect(thrownError.exception).toBeInstanceOf(ForbiddenException);
    }
  });
});
