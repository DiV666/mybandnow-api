import { SongBandId } from '../../../../../../src/Contexts/Moat/Song/domain/value-object/SongBandId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
export class SongBandIdMother {
  static create(value: string): SongBandId {
    return new SongBandId(value);
  }

  static random(): SongBandId {
    return this.create(UuidMother.random());
  }
}
