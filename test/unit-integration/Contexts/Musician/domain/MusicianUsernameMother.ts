import { MusicianUsername } from '../../../../../src/Contexts/Musician/domain/value-object/MusicianUsername.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class MusicianUsernameMother {
  static create(value: string): MusicianUsername {
    return new MusicianUsername(value);
  }

  static random(): MusicianUsername {
    return this.create(StringMother.random());
  }
}
