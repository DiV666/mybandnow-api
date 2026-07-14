import jsonwebtoken from 'jsonwebtoken';
import { afterEach, describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const localJwtBearerTokenModuleUrl = pathToFileURL(
  resolve(
    import.meta.dirname,
    '../../../../../../../src/Contexts/Mybandnow/Shared/infrastructure/Authentication/LocalJwtBearerToken.ts'
  )
).href;

let moduleNonce = 0;

describe('LocalJwtBearerToken', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns the project auth context using the JWT subject as id and empty roles by default', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign({}, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      subject: 'user-123'
    });

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload).toEqual({
      id: 'user-123',
      roles: []
    });
  });

  it('prefers the standard JWT subject and preserves valid role claims in the project auth context', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign(
      { userId: 'legacy-user-456', roles: ['admin-scope', 'band:read'] },
      process.env.JWT_SECRET as string,
      {
        algorithm: 'HS256',
        subject: 'standard-user-789'
      }
    );

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload).toEqual({
      id: 'standard-user-789',
      roles: ['admin-scope', 'band:read']
    });
  });

  it('filters malformed roles from untrusted jwt claims during auth-context normalization', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign(
      { roles: ['band:read', 123, null, 'band:write'] },
      process.env.JWT_SECRET as string,
      {
        algorithm: 'HS256',
        subject: 'user-123'
      }
    );

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload).toEqual({
      id: 'user-123',
      roles: ['band:read', 'band:write']
    });
  });

  it('rejects the token with 403 when required scopes are missing from the normalized roles', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign({ roles: ['band:read'] }, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      subject: 'user-123'
    });

    // Act + Assert
    await expect(new LocalJwtBearerToken().verifyJWT(token, ['band:write'])).rejects.toMatchObject({
      status: 403,
      cause: 'Forbidden. User does not include one of the required roles permissions: band:write'
    });
  });

  it('rejects the token when sub is present but empty even if a legacy userId claim exists', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign({ userId: 'legacy-user-456', sub: '' }, process.env.JWT_SECRET as string, {
      algorithm: 'HS256'
    });

    // Act + Assert
    await expect(new LocalJwtBearerToken().verifyJWT(token, [])).rejects.toMatchObject({
      status: 403,
      cause: 'JWT claims are incomplete.'
    });
  });

  it('rejects the token with 401 when the JWT signature is invalid', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign({}, `${process.env.JWT_SECRET as string}-invalid`, {
      algorithm: 'HS256',
      subject: 'user-123'
    });

    // Act + Assert
    await expect(new LocalJwtBearerToken().verifyJWT(token, [])).rejects.toMatchObject({
      status: 401,
      cause: expect.stringContaining('invalid signature')
    });
  });

  it('keeps supporting tokens that already carry an explicit legacy userId claim', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign({ userId: 'legacy-user-456' }, process.env.JWT_SECRET as string, {
      algorithm: 'HS256'
    });

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload).toEqual({
      id: 'legacy-user-456',
      roles: []
    });
  });
});

function createValidEnv(): NodeJS.ProcessEnv {
  return {
    BASE_PATH: '/api',
    CORS_ORIGIN: 'http://localhost:4009',
    CORS_SUCCESS_STATUS: '200',
    DATABASE_URL: 'postgresql://example_user:example_password@localhost:5432/example_db',
    JWT_SECRET: 'example-jwt-signing-key-for-unit-tests-1234',
    KLODING_INTERNAL_PRIVATE_KEY_BASE64: Buffer.from('example-private-key').toString('base64'),
    KLODING_INTERNAL_PUBLIC_KEY_BASE64: Buffer.from('example-public-key').toString('base64'),
    LOG_FILENAME: 'mybandnow-api.log',
    LOG_LEVEL: 'debug',
    LOG_PATH: './logs',
    LOG_TYPES: 'console',
    MAX_PAYLOAD_SIZE: '256kb',
    NODE_ENV: 'test',
    PORT: '4008',
    RABBITMQ_EXCHANGE_NAME: 'domain_events',
    RABBITMQ_HOSTNAME: 'localhost',
    RABBITMQ_MAX_RETRIES: '3',
    RABBITMQ_PASSWORD: 'example_rabbitmq_password',
    RABBITMQ_PORT: '5672',
    RABBITMQ_RETRY_TTL: '1000',
    RABBITMQ_SECURE: 'false',
    RABBITMQ_USERNAME: 'example_rabbitmq_user',
    RABBITMQ_VHOST: 'mybandnow',
    TIMEOUT: '120000'
  };
}

function freshLocalJwtBearerTokenModuleUrl(): string {
  moduleNonce += 1;
  return `${localJwtBearerTokenModuleUrl}?t=${moduleNonce}`;
}
