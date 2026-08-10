import { BandName } from '../../../../../src/Contexts/Band/domain/value-object/BandName.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class BandNameMother {
  static create(value: string): BandName {
    return new BandName(value);
  }

  static random(): BandName {
    return this.create(StringMother.random());
  }
}
