import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianUserIdMother } from '../../domain/MusicianUserIdMother.js';

export class MusicianSearchByUserIdQueryMother {
  private static defaults() {
    return {
      userId: MusicianUserIdMother.random().value
    };
  }

  static create(params?: Partial<MusicianSearchByUserIdQuery>): MusicianSearchByUserIdQuery {
    const data = { ...this.defaults(), ...params };
    return new MusicianSearchByUserIdQuery(data.userId);
  }
}
