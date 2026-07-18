import { InstrumentsDescription } from '../../../../../../src/Contexts/Moat/Instruments/domain/value-object/InstrumentsDescription.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class InstrumentsDescriptionMother {
  static create(value: string): InstrumentsDescription {
    return new InstrumentsDescription(value);
  }

  static random(): InstrumentsDescription {
    return this.create(StringMother.random());
  }
}
