import { SongOriginalVideoclipUrl } from '../../../../../../src/Contexts/Moat/Song/domain/value-object/SongOriginalVideoclipUrl.js';
import { UriMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UriMother.js';

export class SongOriginalVideoclipUrlMother {
  static create(value: string): SongOriginalVideoclipUrl {
    return new SongOriginalVideoclipUrl(value);
  }

  static random(): SongOriginalVideoclipUrl {
    return this.create(UriMother.random());
  }
}
