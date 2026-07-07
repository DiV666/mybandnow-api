import { MotherCreator } from './MotherCreator.js';

export class WordMother {
  static random(length?: number): string {
    return MotherCreator.random().lorem.word(length);
  }
}
