import { SongTitle } from '../../../../../../src/Contexts/Moat/Song/domain/value-object/SongTitle.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class SongTitleMother {
  static create(value: string): SongTitle {
    return new SongTitle(value);
  }

  static random(): SongTitle {
    return this.create(StringMother.random());
  }
}
