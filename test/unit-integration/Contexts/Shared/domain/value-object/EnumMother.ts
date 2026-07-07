import { MotherCreator } from './MotherCreator.js';

export class EnumMother {
  static randomFromEnum(options: Record<string | number, string | number>): string {
    const values = Object.values(options);
    const randomIndex = MotherCreator.random().number.int({ min: 0, max: values.length - 1 });
    return values[randomIndex] as string;
  }
}
