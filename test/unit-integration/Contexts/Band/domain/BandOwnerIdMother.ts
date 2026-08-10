import { BandOwnerId } from '../../../../../src/Contexts/Band/domain/value-object/BandOwnerId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
export class BandOwnerIdMother {
  static create(value: string): BandOwnerId {
    return new BandOwnerId(value);
  }

  static random(): BandOwnerId {
    return this.create(UuidMother.random());
  }
}
