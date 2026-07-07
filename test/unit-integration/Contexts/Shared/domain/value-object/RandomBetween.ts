import { MotherCreator } from './MotherCreator.js';

export class RandomBetween {
  static values<T>(elements: T[]): T {
    return MotherCreator.random().helpers.arrayElement(elements);
  }
}
