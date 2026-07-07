import { describe, it, expect } from 'vitest';
import { EmailMother } from './EmailMother.js';
import { WordMother } from './WordMother.js';
import { EmailValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/EmailValueObject.js';
import { NumberValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/NumberValueObject.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { EnumValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/EnumValueObject.js';
import { EnumMother } from './EnumMother.js';
import { NumberMother } from './NumberMother.js';
import { StringValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/StringValueObject.js';
import { UuidValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/UuidValueObject.js';
import { BooleanValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/BooleanValueObject.js';
import { BooleanMother } from './BooleanMother.js';

enum Operator {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL'
}
class Enum extends EnumValueObject<Operator> {
  constructor(value: Operator) {
    super(value, Object.values(Operator));
  }

  static fromValue(value: keyof typeof Operator): Enum {
    try {
      return new Enum(Operator[value]);
    } catch (ex) {
      throw new InvalidArgumentException({
        message: `The enum filter operator ${value} is invalid`,
        details: ex
      });
    }
  }

  protected throwErrorForInvalidValue(value: Operator): void {
    throw new InvalidArgumentException({ message: `The enum filter operator ${value} is invalid` });
  }
}

class TestEmail extends EmailValueObject {}
class TestNumber extends NumberValueObject {}
class TestString extends StringValueObject {}
class TestUuid extends UuidValueObject {}
class TestBoolean extends BooleanValueObject {}

describe('ValueObject should', () => {
  it('create a UUID value object', () => {
    const uuid = new TestUuid(TestUuid.random());
    expect(uuid).toBeDefined();
    expect(uuid.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('throw an error if UUID value object is not a valid uuid', () => {
    expect(() => {
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new TestUuid(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });

  it('create a STRING value object', () => {
    const str = new TestString(TestString.random(10));
    expect(str).toBeDefined();
    expect(str.value).toHaveLength(10);
  });

  it('throw an error if STRING value object is not a valid string', () => {
    expect(() => {
      // @ts-expect-error -- testing invalid constructor argument for error handling
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new TestString(NumberMother.random());
    }).toThrow(InvalidArgumentException);
  });

  it('create a EMAIL value object', () => {
    const email = new TestEmail(EmailMother.random());
    expect(email).toBeDefined();
    expect(email.value).toContain('@');
  });

  it('throw an error if EMAIL value object is not a valid email', () => {
    expect(() => {
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new TestEmail(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });

  it('create a ENUM value object', () => {
    const value = EnumMother.randomFromEnum(Operator);
    const enumVO = Enum.fromValue(value as keyof typeof Operator);
    expect(enumVO).toBeDefined();
    expect(Object.values(Operator)).toContain(enumVO.value);
  });

  it('throw an error if ENUM value object is not a valid value of enum list', () => {
    expect(() => {
      Enum.fromValue(WordMother.random(4) as keyof typeof Operator);
    }).toThrow(InvalidArgumentException);
  });

  it('create a NUMBER value object', () => {
    const num = new TestNumber(NumberMother.random());
    expect(num).toBeDefined();
    expect(typeof num.value).toBe('number');
  });

  it('throw an error if NUMBER value object is not a valid number', () => {
    expect(() => {
      // @ts-expect-error -- testing invalid constructor argument for error handling
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new TestNumber(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });

  it('create a Boolean value object', () => {
    const bool = new TestBoolean(BooleanMother.random());
    expect(bool).toBeDefined();
    expect(typeof bool.value).toBe('boolean');
  });

  it('throw an error if Boolean value object is not a valid boolean', () => {
    expect(() => {
      // @ts-expect-error -- testing invalid constructor argument for error handling
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new TestBoolean(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });
});
