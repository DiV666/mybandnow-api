import { VideoclipIsPublic } from '../../../../../src/Contexts/Videoclip/domain/value-object/VideoclipIsPublic.js';
import { BooleanMother } from '../../Shared/domain/value-object/BooleanMother.js';
export class VideoclipIsPublicMother {
  static create(value: boolean): VideoclipIsPublic {
    return new VideoclipIsPublic(value);
  }

  static random(): VideoclipIsPublic {
    return this.create(BooleanMother.random());
  }
}
