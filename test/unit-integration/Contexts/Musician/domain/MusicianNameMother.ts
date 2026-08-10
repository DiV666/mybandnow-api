import { MusicianName } from '../../../../../src/Contexts/Musician/domain/value-object/MusicianName.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class MusicianNameMother {
  static create(value: string): MusicianName {
    return new MusicianName(value);
  }

  static random(): MusicianName {
    return this.create(StringMother.random());
  }
}
