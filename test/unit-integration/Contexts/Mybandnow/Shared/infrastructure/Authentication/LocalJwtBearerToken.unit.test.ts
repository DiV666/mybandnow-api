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

  it('returns the JWT subject as userId when the token only contains standard sub and email claims', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign({ email: 'user@example.com' }, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      subject: 'user-123'
    });

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload.userId).toBe('user-123');
    expect(payload.email).toBe('user@example.com');
  });

  it('prefers the standard JWT subject when both sub and userId claims are present', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign(
      { userId: 'legacy-user-456', email: 'legacy@example.com' },
      process.env.JWT_SECRET as string,
      {
        algorithm: 'HS256',
        subject: 'standard-user-789'
      }
    );

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload.userId).toBe('standard-user-789');
    expect(payload.email).toBe('legacy@example.com');
  });

  it('rejects the token when sub is present but empty even if a legacy userId claim exists', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign(
      { userId: 'legacy-user-456', sub: '', email: 'legacy@example.com' },
      process.env.JWT_SECRET as string,
      {
        algorithm: 'HS256'
      }
    );

    // Act + Assert
    await expect(new LocalJwtBearerToken().verifyJWT(token, [])).rejects.toMatchObject({
      status: 403,
      cause: 'JWT claims are incomplete.'
    });
  });

  it('keeps supporting tokens that already carry an explicit userId claim', async () => {
    // Arrange
    process.env = createValidEnv();
    const { LocalJwtBearerToken } = await import(freshLocalJwtBearerTokenModuleUrl());
    const token = jsonwebtoken.sign(
      { userId: 'legacy-user-456', email: 'legacy@example.com' },
      process.env.JWT_SECRET as string,
      {
        algorithm: 'HS256'
      }
    );

    // Act
    const payload = await new LocalJwtBearerToken().verifyJWT(token, []);

    // Assert
    expect(payload.userId).toBe('legacy-user-456');
    expect(payload.email).toBe('legacy@example.com');
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
