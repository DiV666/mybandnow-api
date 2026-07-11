import { VideoclipCreatedAt } from '../../../../../../src/Contexts/Moat/Videoclip/domain/value-object/VideoclipCreatedAt.js';

export class VideoclipCreatedAtMother {
  static create(value: Date): VideoclipCreatedAt {
    return new VideoclipCreatedAt(value);
  }

  static now(): VideoclipCreatedAt {
    return this.create(new Date());
  }
}
