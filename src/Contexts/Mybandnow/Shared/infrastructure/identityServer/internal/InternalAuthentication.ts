import jsonwebtoken from 'jsonwebtoken';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SecurityHandlerException } from '@Contexts/Shared/infrastructure/exceptions/SecurityHandlerException.js';

export type InternalJwtPayload = Record<string, unknown>;

export class InternalAuthentication {
  constructor(private readonly publicKey: string) {}

  async verifyJWT(token: string): Promise<InternalJwtPayload> {
    try {
      const decoded = jsonwebtoken.verify(token, this.publicKey, {
        algorithms: ['RS256']
      });

      if (typeof decoded === 'string' || !decoded.partnerId || !decoded.companyId || !decoded.userId) {
        throw new ForbiddenException('Internal auth claims are incomplete.');
      }

      return {
        partnerId: decoded.partnerId,
        companyId: decoded.companyId,
        userId: decoded.userId
      };
    } catch (error: unknown) {
      // Verifiers stay silent: the diagnostic travels in the error cause and
      // the central unauthorized handler decides whether to log it.
      throw new SecurityHandlerException(403, new ForbiddenException('Forbidden'), {
        cause: `Token is not a valid internal JWT. ${this.errorDetails(error)}`
      });
    }
  }

  private errorDetails(error: unknown): string {
    if (error instanceof ForbiddenException) {
      return error.message;
    }

    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    return String(error);
  }
}
