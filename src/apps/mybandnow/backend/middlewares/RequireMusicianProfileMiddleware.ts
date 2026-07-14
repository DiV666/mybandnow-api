import type { Context } from 'openapi-backend';
import { MusicianSearchByUserId } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';

export class RequireMusicianProfileMiddleware {
  constructor(private readonly musicianSearchByUserId: MusicianSearchByUserId) {}

  async run(context: Context): Promise<void> {
    const userId = context.security.BearerAuth.id as string;
    const response = await this.musicianSearchByUserId.run(new MusicianSearchByUserIdQuery(userId));

    if (!response.musician) {
      throw new ForbiddenException('Profile required');
    }
  }
}
