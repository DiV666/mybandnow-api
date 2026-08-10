import { MusicianId } from '@Contexts/Musician/domain/value-object/MusicianId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class MusicianIdMother {
  static create(value: string): MusicianId {
    return new MusicianId(value);
  }

  static random(): MusicianId {
    return this.create(UuidMother.random());
  }
}
