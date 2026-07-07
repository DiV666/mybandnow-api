import { faker } from '@faker-js/faker';

export class DateMother {
  static create(value: Date): Date {
    return value;
  }

  static now(): Date {
    return new Date();
  }

  static random(): Date {
    return faker.date.recent();
  }

  static future(): Date {
    return faker.date.future();
  }

  static past(): Date {
    return faker.date.past();
  }
}
