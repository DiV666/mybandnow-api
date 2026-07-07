import { faker } from '@faker-js/faker';

export class DataUtil {
  private customData: Record<string, unknown> = {};
  private fakerData: Record<string, () => string | Date> = {
    $uuid: faker.string.uuid,
    $word: faker.word.sample,
    $date: faker.date.recent
  };

  replaceTokensWithCustomOrFakerValues(data: unknown): unknown {
    if (Array.isArray(data)) {
      const arr: unknown[] = [];
      for (const valInArray of data) {
        arr.push(this.replaceTokensWithCustomOrFakerValues(valInArray));
      }
      return arr;
    }

    if (typeof data === 'object' && data !== null) {
      for (const key in data as Record<string, unknown>) {
        (data as Record<string, unknown>)[key] = this.replaceTokensWithCustomOrFakerValues(
          (data as Record<string, unknown>)[key]
        );
      }
      return data;
    }

    if (typeof data === 'string') {
      const afterFake = this.replaceFakeDataOnText(data);
      return this.replaceCustomDataOnText(afterFake);
    }

    return data;
  }

  addPersonalizedParameterAndValue(key: string, value: unknown): void {
    this.customData[`#${key}`] = this.replaceTokensWithCustomOrFakerValues(value);
  }

  private replaceCustomDataOnText(text: string): unknown {
    for (const key in this.customData) {
      if (text.includes(key)) {
        if (typeof this.customData[key] === 'string') {
          text = text.replace(key, this.customData[key] as string);
        } else {
          // If custom data is an object and text contains the key, return the object directly
          return this.customData[key];
        }
      }
    }
    return text;
  }

  private replaceFakeDataOnText(text: string): string {
    for (const key in this.fakerData) {
      const replacementValue = this.fakerData[key]();
      const valueAsString =
        replacementValue instanceof Date ? replacementValue.toISOString() : String(replacementValue);
      text = text.replace(key, valueAsString);
    }
    return text;
  }
}
