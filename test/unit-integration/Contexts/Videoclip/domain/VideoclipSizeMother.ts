import { VideoclipSize } from '../../../../../src/Contexts/Videoclip/domain/value-object/VideoclipSize.js';
import { NumberMother } from '../../Shared/domain/value-object/NumberMother.js';
export class VideoclipSizeMother {
  static create(value: number): VideoclipSize {
    return new VideoclipSize(value);
  }

  static random(): VideoclipSize {
    return this.create(NumberMother.random({ max: 100000 }));
  }
}
