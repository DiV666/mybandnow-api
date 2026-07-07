import { createPrivateKey, createPublicKey } from 'node:crypto';
import KeycloakConfig from './KeycloakConfig.js';
import { env } from '../../config/env.js';

export class KeycloakConfigFactory {
  static createConfig(): KeycloakConfig {
    return {
      origin: env.KEYCLOAK_ORIGIN,
      realm: env.KEYCLOAK_REALM,
      audience: env.KEYCLOAK_AUDIENCE,
      pinnedPublicKey: this.decodePinnedPublicKey()
    };
  }

  private static decodePinnedPublicKey(): string | undefined {
    const pinnedPublicKeyBase64 = env.KLODING_KEYCLOAK_PUBLIC_KEY_BASE64?.trim();

    if (!pinnedPublicKeyBase64) {
      return undefined;
    }

    const decodedPublicKey = Buffer.from(pinnedPublicKeyBase64, 'base64').toString('utf8');

    let publicKeyType: string | undefined;
    try {
      publicKeyType = createPublicKey(decodedPublicKey).asymmetricKeyType;
    } catch {
      throw new Error(
        'Invalid KLODING_KEYCLOAK_PUBLIC_KEY_BASE64: the decoded value is not a valid PEM public key. ' +
          'Fix the value or unset the variable to fall back to the dynamic JWKS lookup.'
      );
    }

    if (this.isPrivateKeyMaterial(decodedPublicKey)) {
      throw new Error(
        'Invalid KLODING_KEYCLOAK_PUBLIC_KEY_BASE64: a PRIVATE key was detected where a PUBLIC key was expected. ' +
          'Provide the PEM PUBLIC key half of the keypair instead.'
      );
    }

    if (publicKeyType !== 'rsa') {
      throw new Error(
        `Invalid KLODING_KEYCLOAK_PUBLIC_KEY_BASE64: expected an RSA public key (RS256 verification) but got key type <${publicKeyType}>.`
      );
    }

    return decodedPublicKey;
  }

  private static isPrivateKeyMaterial(pem: string): boolean {
    try {
      createPrivateKey(pem);
      return true;
    } catch {
      return false;
    }
  }
}
