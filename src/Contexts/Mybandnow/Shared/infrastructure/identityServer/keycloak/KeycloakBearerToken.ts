import jsonwebtoken, { JwtHeader, SigningKeyCallback, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { UnauthorizedException } from '@Contexts/Shared/domain/exceptions/UnauthorizedException.js';
import type KeycloakConfig from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfig.js';
import type { JWTVerifier } from '@Contexts/Shared/domain/JWTVerifier.js';

/**
 * Define la estructura esperada del payload del token de Keycloak.
 */
export interface KeycloakJwtPayload extends JwtPayload {
  realm_access?: {
    roles?: string[];
  };
  azp?: string;
  userId?: string;
}

export class KeycloakBearerToken implements JWTVerifier {
  private readonly client: JwksClient;

  constructor(
    private readonly config: KeycloakConfig,
    private readonly nodeEnv: string
  ) {
    const isTestEnvironment = nodeEnv === 'test';

    this.client = jwksClient({
      jwksUri: `${config.origin}/realms/${config.realm}/protocol/openid-connect/certs`,
      cache: true, // Habilita el caché de claves
      cacheMaxEntries: 5, // Almacena hasta 5 claves en caché
      cacheMaxAge: 10 * 60 * 1000, // Las claves en caché expiran a los 10 minutos
      // Deshabilitamos el rate limiting en el entorno de test para evitar errores en ejecuciones rápidas y paralelas.
      // En producción, mantenemos el límite para proteger el endpoint de Keycloak.
      rateLimit: !isTestEnvironment,
      jwksRequestsPerMinute: 10
    });
  }

  async verifyJWT(token: string, requiredScopes: string[]): Promise<KeycloakJwtPayload> {
    if (!token || token.trim().length === 0) {
      throw new UnauthorizedException('Missing or empty token');
    }

    const decodedToken = await this.verifyTokenLocally(token);
    this.ensureAudience(decodedToken);
    const userRoles = decodedToken.realm_access?.roles || [];

    this.ensurePermissions(requiredScopes, userRoles);

    return {
      ...decodedToken,
      userId: decodedToken.sub
    };
  }

  // Verifiers stay silent: diagnostic detail travels in the error cause so the
  // central unauthorized handler decides whether to log it, while the
  // client-facing message stays generic.
  private async verifyTokenLocally(token: string): Promise<KeycloakJwtPayload> {
    return new Promise((resolve, reject) => {
      const options: VerifyOptions = {
        issuer: `${this.config.origin}/realms/${this.config.realm}`,
        algorithms: ['RS256']
      };
      // Certificate pinning (opt-in): when a pinned public key is configured, verify
      // the signature against it directly and skip the dynamic JWKS lookup.
      const keyOrKeyResolver = this.config.pinnedPublicKey ?? this.getKey.bind(this);
      jsonwebtoken.verify(token, keyOrKeyResolver, options, (err, decoded) => {
        if (err) {
          return reject(this.withCause(new UnauthorizedException('Token verification failed.'), err));
        }
        resolve(decoded as KeycloakJwtPayload);
      });
    });
  }

  /**
   * Ensures the token's `aud` claim includes the configured audience.
   * Keycloak's default `account` client scope adds `account` to every token's `aud`,
   * so the configured audience is expected to be `account` unless the realm defines
   * a dedicated audience mapper for this API.
   */
  private ensureAudience(payload: KeycloakJwtPayload): void {
    const rawAudience = payload.aud ?? [];
    const audiences = Array.isArray(rawAudience) ? rawAudience : [rawAudience];
    const isValidAudience = audiences.includes(this.config.audience);

    if (!isValidAudience) {
      throw this.withCause(
        new UnauthorizedException('Token audience validation failed.'),
        'Token audience does not include the configured audience.'
      );
    }
  }

  private getKey(header: JwtHeader, callback: SigningKeyCallback): void {
    if (!header.kid) {
      callback(
        this.withCause(
          new UnauthorizedException('Token is malformed (missing kid).'),
          'Token is missing "kid" in the header.'
        ),
        undefined
      );
      return;
    }

    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(this.withCause(new UnauthorizedException('Could not retrieve signing key.'), err), undefined);
        return;
      }
      if (!key) {
        callback(
          this.withCause(
            new UnauthorizedException('Token signing key not found.'),
            `No signing key found for kid [${header.kid}].`
          ),
          undefined
        );
        return;
      }
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  private ensurePermissions(requiredScopes: string[], userRoles: string[]): void {
    if (requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every((scope) => userRoles.includes(scope));
      if (!hasAllScopes) {
        throw this.withCause(
          new ForbiddenException('Insufficient permissions.'),
          `User does not have required roles: ${requiredScopes.join(', ')}`
        );
      }
    }
  }

  private withCause<T extends Error>(error: T, cause: unknown): T {
    error.cause = cause;
    return error;
  }
}
