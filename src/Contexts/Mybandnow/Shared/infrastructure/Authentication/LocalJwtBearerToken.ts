import jsonwebtoken from 'jsonwebtoken';
import { JWTVerifier } from '@Contexts/Shared/domain/JWTVerifier.js';
import { UnauthorizedException } from '@Contexts/Shared/domain/exceptions/UnauthorizedException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SecurityHandlerException } from '@Contexts/Shared/infrastructure/exceptions/SecurityHandlerException.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export interface LocalJwtPayload extends jsonwebtoken.JwtPayload {
  userId: string;
  email: string;
  roles?: string[];
}

export class LocalJwtBearerToken implements JWTVerifier {
  async verifyJWT(token: string, requiredScopes: string[]): Promise<LocalJwtPayload> {
    try {
      const decoded = jsonwebtoken.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256']
      });

      if (typeof decoded === 'string' || !decoded.userId || !decoded.email) {
        throw new ForbiddenException('JWT claims are incomplete.');
      }

      if (requiredScopes.length > 0) {
        const userRoles = (decoded.roles as string[]) || [];
        const hasAllScopes = requiredScopes.every((scope) => userRoles.includes(scope));
        if (!hasAllScopes) {
          throw new ForbiddenException(
            `Forbidden. User does not include one of the required roles permissions: ${requiredScopes.join(', ')}`
          );
        }
      }

      return {
        ...decoded,
        userId: decoded.userId as string,
        email: decoded.email as string
      };
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) {
        throw new SecurityHandlerException(403, error, { cause: error.message });
      }
      throw new SecurityHandlerException(401, new UnauthorizedException('Unauthorized'), {
        cause: `Token is not a valid local JWT. ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}
