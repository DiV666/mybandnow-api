import { MotherCreator } from './MotherCreator.js';

export class NumberMother {
  static random(options?: { min?: number; max?: number }): number {
    return MotherCreator.random().number.int(options);
  }
}
