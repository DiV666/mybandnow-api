import { describe, it, expect, vi } from 'vitest';
import type { Context as OpenAPIContext } from 'openapi-backend';
import {
  createSecurityHandler,
  extractCredential
} from '../../../../../../src/apps/mybandnow/backend/routes/openapiSecurity.js';
import { CredentialsNotProvidedException } from '../../../../../../src/Contexts/Shared/infrastructure/exceptions/CredentialsNotProvidedException.js';

function contextWithSchemes(securitySchemes: Record<string, unknown>): OpenAPIContext {
  return {
    api: {
      definition: {
        components: {
          securitySchemes
        }
      }
    }
  } as unknown as OpenAPIContext;
}

const defaultContext = contextWithSchemes({
  BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  InternalAuth: { type: 'apiKey', in: 'header', name: 'x-internal-auth' }
});

describe('extractCredential', () => {
  describe('http bearer schemes', () => {
    it('extracts the token from the Authorization header stripping the Bearer prefix', () => {
      const req = { headers: { authorization: 'Bearer my-token' } };

      expect(extractCredential('BearerAuth', defaultContext, req)).toBe('my-token');
    });

    it('strips the Bearer prefix case-insensitively', () => {
      const req = { headers: { authorization: 'bearer my-token' } };

      expect(extractCredential('BearerAuth', defaultContext, req)).toBe('my-token');
    });

    it('throws CredentialsNotProvidedException when the Authorization header is absent', () => {
      expect(() => extractCredential('BearerAuth', defaultContext, { headers: {} })).toThrow(
        CredentialsNotProvidedException
      );
    });

    it('throws CredentialsNotProvidedException when the Authorization header only has the Bearer prefix', () => {
      const req = { headers: { authorization: 'Bearer ' } };

      expect(() => extractCredential('BearerAuth', defaultContext, req)).toThrow(CredentialsNotProvidedException);
    });
  });

  describe('apiKey header schemes', () => {
    it('extracts the credential from the header declared by the scheme', () => {
      const req = { headers: { 'x-internal-auth': 'internal-token' } };

      expect(extractCredential('InternalAuth', defaultContext, req)).toBe('internal-token');
    });

    it('takes the first value when the header arrives as an array', () => {
      const req = { headers: { 'x-internal-auth': ['first-token', 'second-token'] } };

      expect(extractCredential('InternalAuth', defaultContext, req)).toBe('first-token');
    });

    it('throws CredentialsNotProvidedException when the header is absent', () => {
      expect(() => extractCredential('InternalAuth', defaultContext, { headers: {} })).toThrow(
        CredentialsNotProvidedException
      );
    });

    it('throws CredentialsNotProvidedException when the header is empty', () => {
      const req = { headers: { 'x-internal-auth': '   ' } };

      expect(() => extractCredential('InternalAuth', defaultContext, req)).toThrow(CredentialsNotProvidedException);
    });
  });

  it('works for any scheme name declared in the OpenAPI document', () => {
    const context = contextWithSchemes({
      PartnerAuth: { type: 'apiKey', in: 'header', name: 'x-partner-key' }
    });
    const req = { headers: { 'x-partner-key': 'partner-secret' } };

    expect(extractCredential('PartnerAuth', context, req)).toBe('partner-secret');
  });

  it('throws a configuration error when the scheme is not declared in the OpenAPI document', () => {
    expect(() => extractCredential('UnknownAuth', defaultContext, { headers: {} })).toThrow(
      /not defined in the OpenAPI document/
    );
  });

  it('throws a configuration error for unsupported scheme types', () => {
    const context = contextWithSchemes({
      CookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' }
    });

    expect(() => extractCredential('CookieAuth', context, { headers: {} })).toThrow(/unsupported type/);
  });
});

describe('createSecurityHandler', () => {
  it('extracts the credential and delegates verification with it', async () => {
    const verify = vi.fn().mockResolvedValue({ sub: 'user-1' });
    const handler = createSecurityHandler('BearerAuth', verify);
    const req = { headers: { authorization: 'Bearer my-token' } };

    const result = await handler(defaultContext, req);

    expect(verify).toHaveBeenCalledWith('my-token', defaultContext);
    expect(result).toEqual({ sub: 'user-1' });
  });

  it('rejects with the not-provided sentinel without calling the verifier when credentials are absent', async () => {
    const verify = vi.fn();
    const handler = createSecurityHandler('BearerAuth', verify);

    await expect(handler(defaultContext, { headers: {} })).rejects.toBeInstanceOf(CredentialsNotProvidedException);
    expect(verify).not.toHaveBeenCalled();
  });
});
