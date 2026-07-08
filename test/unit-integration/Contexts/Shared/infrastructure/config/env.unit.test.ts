import fs from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';

const envModuleUrl = pathToFileURL(
  resolve(import.meta.dirname, '../../../../../../src/Contexts/Shared/infrastructure/config/env.ts')
).href;
let moduleNonce = 0;

describe('env config bootstrap logging', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('fails module evaluation after synchronously logging invalid environment variables', async () => {
    process.env = createValidEnv();
    delete process.env.RABBITMQ_USERNAME;
    delete process.env.RABBITMQ_PASSWORD;

    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => 1);

    await expect(import(freshEnvModuleUrl())).rejects.toThrow('Invalid environment variables');

    expect(writeSyncSpy).toHaveBeenCalledTimes(1);

    const logEntry = JSON.parse(String(writeSyncSpy.mock.calls[0]?.[1]).trim()) as {
      context: { errors: Record<string, string[]> };
      level: string;
      msg: string;
    };

    expect(logEntry.level).toBe('error');
    expect(logEntry.msg).toBe('Invalid environment variables');
    expect(logEntry.context.errors).toHaveProperty('RABBITMQ_USERNAME');
    expect(logEntry.context.errors).toHaveProperty('RABBITMQ_PASSWORD');
    expect(writeSyncSpy).toHaveBeenCalledWith(
      process.stderr.fd,
      expect.stringContaining('Invalid environment variables')
    );
  });

  it('rejects invalid keycloak urls using the zod 4 url schema', async () => {
    process.env = createValidEnv();

    const { envSchema } = await import(freshEnvModuleUrl());
    const result = envSchema.safeParse({
      ...createValidEnv(),
      KEYCLOAK_ORIGIN: 'not-a-url'
    });

    expect(result.success).toBe(false);

    const errors = result.success ? {} : fieldErrors(result.error);

    expect(errors.KEYCLOAK_ORIGIN).toContain('Invalid URL');
  });
});

function createValidEnv(): NodeJS.ProcessEnv {
  return {
    BASE_PATH: '/api',
    CORS_ORIGIN: 'http://localhost:4009',
    CORS_SUCCESS_STATUS: '200',
    KEYCLOAK_ADMIN_PASS: 'admin-pass',
    KEYCLOAK_ADMIN_USER: 'admin-user',
    KEYCLOAK_AUDIENCE: 'account',
    KEYCLOAK_ORIGIN: 'http://localhost:8080',
    KEYCLOAK_REALM: 'kloding',
    LOG_FILENAME: 'mybandnow-api.log',
    LOG_LEVEL: 'debug',
    LOG_PATH: './logs',
    LOG_TYPES: 'console',
    MAX_PAYLOAD_SIZE: '256kb',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mybandnow',
    NODE_ENV: 'test',
    PORT: '4008',
    RABBITMQ_EXCHANGE_NAME: 'domain_events',
    RABBITMQ_HOSTNAME: 'localhost',
    RABBITMQ_MAX_RETRIES: '3',
    RABBITMQ_PASSWORD: 'rabbit-pass',
    RABBITMQ_PORT: '5672',
    RABBITMQ_RETRY_TTL: '1000',
    RABBITMQ_SECURE: 'false',
    RABBITMQ_USERNAME: 'rabbit-user',
    RABBITMQ_VHOST: 'mybandnow',
    KLODING_INTERNAL_PRIVATE_KEY_BASE64: Buffer.from('private-key').toString('base64'),
    KLODING_INTERNAL_PUBLIC_KEY_BASE64: Buffer.from('public-key').toString('base64'),
    TEST_KEYCLOAK_USER_PASSWORD: 'password123',
    TIMEOUT: '120000'
  };
}

function freshEnvModuleUrl(): string {
  moduleNonce += 1;
  return `${envModuleUrl}?t=${moduleNonce}`;
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((accumulator, issue) => {
    const field = issue.path[0];

    if (typeof field !== 'string') {
      return accumulator;
    }

    if (!accumulator[field]) {
      accumulator[field] = [];
    }

    accumulator[field].push(issue.message);
    return accumulator;
  }, {});
}
