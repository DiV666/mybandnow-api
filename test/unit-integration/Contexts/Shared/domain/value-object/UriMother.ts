import { MotherCreator } from './MotherCreator.js';

export class UriMother {
  static random(): string {
    return MotherCreator.random().internet.url();
  }
}
