import { MotherCreator } from './MotherCreator.js';

export class EmailMother {
  static random(): string {
    return MotherCreator.random().internet.email();
  }
}
