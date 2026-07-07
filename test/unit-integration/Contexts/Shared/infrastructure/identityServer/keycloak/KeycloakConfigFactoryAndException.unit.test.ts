import { generateKeyPairSync } from 'node:crypto';
import { describe, it, expect, afterEach } from 'vitest';
import { KeycloakConfigFactory } from '../../../../../../../src/Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfigFactory.js';
import { KeycloakException } from '../../../../../../../src/Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakException.js';
import { env } from '../../../../../../../src/Contexts/Shared/infrastructure/config/env.js';

describe('KeycloakConfigFactory', () => {
  it('creates config from env variables', () => {
    // Arrange — KEYCLOAK_ORIGIN and KEYCLOAK_REALM come from the validated env schema (loaded from .env/process.env)
    const config = KeycloakConfigFactory.createConfig();

    // Assert
    expect(config.origin).toBe(process.env.KEYCLOAK_ORIGIN);
    expect(config.realm).toBe(process.env.KEYCLOAK_REALM);
  });

  it('returns a non-empty origin', () => {
    const config = KeycloakConfigFactory.createConfig();
    expect(config.origin).toBeTruthy();
  });

  it('returns a non-empty realm', () => {
    const config = KeycloakConfigFactory.createConfig();
    expect(config.realm).toBeTruthy();
  });
});

describe('KeycloakConfigFactory pinned public key', () => {
  const originalPinnedKeyBase64 = env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64;

  afterEach(() => {
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = originalPinnedKeyBase64;
  });

  it('returns undefined pinnedPublicKey when the env var is absent', () => {
    // Arrange
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = undefined;

    // Act
    const config = KeycloakConfigFactory.createConfig();

    // Assert
    expect(config.pinnedPublicKey).toBeUndefined();
  });

  it('returns undefined pinnedPublicKey when the env var is an empty string', () => {
    // Arrange
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = '';

    // Act
    const config = KeycloakConfigFactory.createConfig();

    // Assert
    expect(config.pinnedPublicKey).toBeUndefined();
  });

  it('returns undefined pinnedPublicKey when the env var is whitespace-only', () => {
    // Arrange
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = '   ';

    // Act
    const config = KeycloakConfigFactory.createConfig();

    // Assert
    expect(config.pinnedPublicKey).toBeUndefined();
  });

  it('decodes a valid base64-encoded PEM public key', () => {
    // Arrange
    const { publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = Buffer.from(publicKey, 'utf8').toString('base64');

    // Act
    const config = KeycloakConfigFactory.createConfig();

    // Assert
    expect(config.pinnedPublicKey).toBe(publicKey);
  });

  it('throws when the config is created and the decoded value is not a valid PEM public key', () => {
    // Arrange
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = Buffer.from('not a pem public key', 'utf8').toString('base64');

    // Act & Assert
    expect(() => KeycloakConfigFactory.createConfig()).toThrow(/KLODING_KEYCLOAK_PUBLIC_KEY_BASE64/);
  });

  it('throws when the decoded value is a PRIVATE key instead of a public key', () => {
    // Arrange
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = Buffer.from(privateKey, 'utf8').toString('base64');

    // Act & Assert
    expect(() => KeycloakConfigFactory.createConfig()).toThrow(/KLODING_KEYCLOAK_PUBLIC_KEY_BASE64.*PRIVATE key/);
  });

  it('throws when the decoded value is a non-RSA (EC) public key', () => {
    // Arrange
    const { publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64 = Buffer.from(publicKey, 'utf8').toString('base64');

    // Act & Assert
    expect(() => KeycloakConfigFactory.createConfig()).toThrow(/KLODING_KEYCLOAK_PUBLIC_KEY_BASE64.*RSA/);
  });
});

describe('KeycloakException', () => {
  it('creates exception with default message and provided details', () => {
    // Arrange & Act
    const exception = new KeycloakException({ details: { status: 500 } });

    // Assert
    expect(exception.message).toContain('Keycloak library has thrown an exception');
    expect(exception.details).toEqual({ status: 500 });
  });

  it('uses provided code', () => {
    const exception = new KeycloakException({ code: 'KC_ERROR' });
    expect(exception.code).toBe('KC_ERROR');
  });

  it('defaults code to "00000" when not provided', () => {
    const exception = new KeycloakException({});
    expect(exception.code).toBe('00000');
  });

  it('extends Exception and is therefore instanceof Error', () => {
    const exception = new KeycloakException({});
    expect(exception).toBeInstanceOf(Error);
  });

  it('serialises via toJSON including details', () => {
    const exception = new KeycloakException({ code: 'KC_ERR', details: 'boom' });
    const json = exception.toJSON();
    expect(json.code).toBe('KC_ERR');
    expect(json.details).toBe('boom');
  });
});
