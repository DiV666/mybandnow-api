import { SongId } from '@Contexts/Song/domain/value-object/SongId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class SongIdMother {
  static create(value: string): SongId {
    return new SongId(value);
  }

  static random(): SongId {
    return this.create(UuidMother.random());
  }
}
