import jsonwebtoken from 'jsonwebtoken';
import { JWTVerifier } from '@Contexts/Shared/domain/JWTVerifier.js';
import { UnauthorizedException } from '@Contexts/Shared/domain/exceptions/UnauthorizedException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SecurityHandlerException } from '@Contexts/Shared/infrastructure/exceptions/SecurityHandlerException.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { UserPersistenceRepository } from '@Contexts/Mybandnow/User/domain/repository/UserPersistenceRepository.js';

interface LocalJwtClaims extends jsonwebtoken.JwtPayload {
  sub?: string;
  userId?: string;
  roles?: unknown;
}

export class LocalJwtBearerToken implements JWTVerifier {
  constructor(private readonly userRepository: UserPersistenceRepository) {}

  async verifyJWT(token: string, requiredScopes: string[]): Promise<AuthenticatedUserContext> {
    try {
      const decoded = jsonwebtoken.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256']
      });

      if (typeof decoded === 'string') {
        throw new ForbiddenException('JWT claims are incomplete.');
      }

      const claims = decoded as LocalJwtClaims;
      const id = claims.sub ?? claims.userId;

      if (!id) {
        throw new ForbiddenException('JWT claims are incomplete.');
      }

      const userExists = await this.userRepository.existsById(id);
      if (!userExists) {
        throw new UnauthorizedException('Unauthorized');
      }

      const roles = this.normalizeRoles(claims.roles);

      if (requiredScopes.length > 0) {
        const hasAllScopes = requiredScopes.every((scope) => roles.includes(scope));
        if (!hasAllScopes) {
          throw new ForbiddenException(
            `Forbidden. User does not include one of the required roles permissions: ${requiredScopes.join(', ')}`
          );
        }
      }

      return { id, roles };
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) {
        throw new SecurityHandlerException(403, error, { cause: error.message });
      }

      if (error instanceof UnauthorizedException) {
        throw new SecurityHandlerException(401, new UnauthorizedException('Unauthorized'), {
          cause: 'User referenced by JWT subject does not exist.'
        });
      }

      if (error instanceof jsonwebtoken.JsonWebTokenError) {
        throw new SecurityHandlerException(401, new UnauthorizedException('Unauthorized'), {
          cause: `Token is not a valid local JWT. ${error.message}`
        });
      }

      throw error;
    }
  }

  private normalizeRoles(roles: unknown): string[] {
    if (!Array.isArray(roles)) {
      return [];
    }

    return roles.filter((role): role is string => typeof role === 'string');
  }
}
