import { MotherCreator } from './MotherCreator.js';

export class PhoneMother {
  static random(): string {
    return MotherCreator.random().phone.number();
  }
}
