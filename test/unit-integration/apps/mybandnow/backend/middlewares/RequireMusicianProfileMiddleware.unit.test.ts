import { describe, it, expect, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import type { Context } from 'openapi-backend';
import { ForbiddenException } from '../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { MusicianSearchByUserId } from '../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { RequireMusicianProfileMiddleware } from '../../../../../../src/apps/mybandnow/backend/middlewares/RequireMusicianProfileMiddleware.js';

describe('RequireMusicianProfileMiddleware', () => {
  let musicianSearchByUserId: MockProxy<MusicianSearchByUserId>;
  let middleware: RequireMusicianProfileMiddleware;

  beforeEach(() => {
    musicianSearchByUserId = mock<MusicianSearchByUserId>();
    middleware = new RequireMusicianProfileMiddleware(musicianSearchByUserId);
  });

  it('throws a forbidden exception when the musician profile does not exist', async () => {
    // Arrange
    const context = authenticatedContext('user-123');
    musicianSearchByUserId.run.mockResolvedValue(new MusicianSearchByUserIdResponse(null));

    // Act / Assert
    await expect(middleware.run(context)).rejects.toEqual(new ForbiddenException('Profile required'));
    expect(musicianSearchByUserId.run).toHaveBeenCalledWith(new MusicianSearchByUserIdQuery('user-123'));
  });

  it('allows the request when the musician profile exists', async () => {
    // Arrange
    const context = authenticatedContext('user-123');
    musicianSearchByUserId.run.mockResolvedValue(
      new MusicianSearchByUserIdResponse({
        id: 'musician-123',
        userId: 'user-123',
        name: 'Daniel',
        username: 'daniel'
      })
    );

    // Act
    await middleware.run(context);

    // Assert
    expect(musicianSearchByUserId.run).toHaveBeenCalledWith(new MusicianSearchByUserIdQuery('user-123'));
  });
});

function authenticatedContext(userId: string): Context {
  return {
    security: {
      BearerAuth: {
        userId
      }
    }
  } as unknown as Context;
}
