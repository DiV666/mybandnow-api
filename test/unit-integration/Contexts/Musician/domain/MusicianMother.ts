import { Musician } from '@Contexts/Musician/domain/Musician.js';
import { MusicianIdMother } from './MusicianIdMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';
import { MusicianUserIdMother } from './MusicianUserIdMother.js';
import { MusicianNameMother } from './MusicianNameMother.js';
import { MusicianUsernameMother } from './MusicianUsernameMother.js';

export class MusicianMother {
  private static defaults(): Partial<Musician> {
    return {
      id: MusicianIdMother.random(),
      username: MusicianUsernameMother.random(),
      name: MusicianNameMother.random(),
      userId: MusicianUserIdMother.random()
    };
  }

  static create(...params: Partial<Musician>[]): Musician {
    const data = Object.assign({}, MusicianMother.defaults(), ...params) as Required<Musician>;

    return Musician.fromPrimitives({
      id: data.id.value,
      username: data.username.value,
      name: data.name.value,
      userId: data.userId.value
    });
  }

  static random(): Musician {
    return MusicianMother.create(MusicianMother.defaults());
  }

  static createList(): Array<Musician> {
    return Repeater.random(MusicianMother.create);
  }
}
