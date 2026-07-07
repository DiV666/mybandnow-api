import { MotherCreator } from './MotherCreator.js';

export class BooleanMother {
  static random(): boolean {
    return MotherCreator.random().datatype.boolean();
  }
}
