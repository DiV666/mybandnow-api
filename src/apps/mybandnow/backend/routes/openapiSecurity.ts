import type { Context as OpenAPIContext } from 'openapi-backend';
import { CredentialsNotProvidedException } from '@Contexts/Shared/infrastructure/exceptions/CredentialsNotProvidedException.js';

/**
 * Minimal request shape shared by Express and openapi-backend requests:
 * credential extraction only needs access to the headers.
 */
export interface RequestWithHeaders {
  headers?: Record<string, string | string[] | undefined>;
}

interface SecuritySchemeShape {
  type?: string;
  scheme?: string;
  in?: string;
  name?: string;
}

export type CredentialVerifier = (credential: string, context: OpenAPIContext) => Promise<unknown>;

function resolveSecurityScheme(schemeName: string, context: OpenAPIContext): SecuritySchemeShape {
  const securitySchemes = (context.api?.definition?.components?.securitySchemes ?? {}) as Record<
    string,
    SecuritySchemeShape | { $ref: string }
  >;
  const scheme = securitySchemes[schemeName];

  if (!scheme || '$ref' in scheme) {
    throw new Error(`Security scheme <${schemeName}> is not defined in the OpenAPI document components.`);
  }

  return scheme;
}

function headerValue(req: RequestWithHeaders, headerName: string): string | undefined {
  const rawValue = req.headers?.[headerName.toLowerCase()];
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/**
 * Extracts the credential for a security scheme, driven by its OpenAPI
 * definition (no hardcoded scheme names or header names).
 *
 * Throws CredentialsNotProvidedException when the client did not send the
 * scheme's credential — the central unauthorized handler treats that as
 * "scheme not attempted" instead of an authentication failure.
 */
export function extractCredential(schemeName: string, context: OpenAPIContext, req: RequestWithHeaders): string {
  const scheme = resolveSecurityScheme(schemeName, context);

  if (scheme.type === 'http' && scheme.scheme?.toLowerCase() === 'bearer') {
    const authorization = headerValue(req, 'authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new CredentialsNotProvidedException(schemeName);
    }

    return token;
  }

  if (scheme.type === 'apiKey' && scheme.in === 'header' && scheme.name) {
    const token = headerValue(req, scheme.name);

    if (!token) {
      throw new CredentialsNotProvidedException(schemeName);
    }

    return token;
  }

  throw new Error(
    `Security scheme <${schemeName}> uses an unsupported type; supported: http bearer, apiKey in header.`
  );
}

/**
 * Builds a thin openapi-backend security handler: extract the credential for
 * the scheme (throws the not-provided sentinel when absent) and delegate
 * verification. Verifiers must stay silent — diagnostic detail travels inside
 * the thrown exception and the central unauthorized handler decides logging.
 */
export function createSecurityHandler(schemeName: string, verify: CredentialVerifier) {
  return async (context: OpenAPIContext, req: RequestWithHeaders): Promise<unknown> => {
    const credential = extractCredential(schemeName, context, req);

    return verify(credential, context);
  };
}
