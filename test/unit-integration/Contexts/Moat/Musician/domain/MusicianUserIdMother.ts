import { MusicianUserId } from '../../../../../../src/Contexts/Moat/Musician/domain/value-object/MusicianUserId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
export class MusicianUserIdMother {
  static create(value: string): MusicianUserId {
    return new MusicianUserId(value);
  }

  static random(): MusicianUserId {
    return this.create(UuidMother.random());
  }
}
