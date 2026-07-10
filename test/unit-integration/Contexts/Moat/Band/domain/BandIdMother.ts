import { BandId } from '@Contexts/Moat/Band/domain/value-object/BandId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class BandIdMother {
  static create(value: string): BandId {
    return new BandId(value);
  }

  static random(): BandId {
    return this.create(UuidMother.random());
  }
}
