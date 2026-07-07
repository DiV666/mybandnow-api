import { MotherCreator } from './MotherCreator.js';

export class StringMother {
  static random(length?: number): string {
    return MotherCreator.random().string.alpha(length);
  }
}
