import { NumberMother } from './NumberMother.js';
export class Repeater {
  static random<T>(callable: () => T, iterations?: number): T[] {
    return Array(
      iterations ||
        NumberMother.random({
          min: 2,
          max: 10
        })
    )
      .fill({})
      .map(() => callable());
  }
}
