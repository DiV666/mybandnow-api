import { MotherCreator } from './MotherCreator.js';

export class TextMother {
  static random(length?: number): string {
    return MotherCreator.random().lorem.words(length);
  }
}
