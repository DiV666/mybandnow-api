import { describe, expectTypeOf, it } from 'vitest';
import { Primitives } from '../../../../../src/Contexts/Shared/domain/Primitives.js';

interface ExpectedNestedJsonPrimitives {
  readonly enabled: boolean;
  readonly label: string;
}

interface ExpectedValueWithSiblingPrimitive {
  readonly value: string;
  readonly unit: string;
}

interface ExpectedComplexJsonPrimitives {
  readonly nested: ExpectedNestedJsonPrimitives;
  readonly tags: string[];
  readonly measuredLabel: ExpectedValueWithSiblingPrimitive;
}

interface ExpectedMetadataPrimitives {
  readonly publishedAt: Date;
  readonly owner: string;
}

interface ExpectedDomainPrimitives {
  readonly id: string;
  readonly metadata: ExpectedMetadataPrimitives;
  readonly config: ExpectedComplexJsonPrimitives;
  readonly children: ExpectedMetadataPrimitives[];
  readonly createdAt: Date;
}

type IsTypeEqual<Actual, Expected> =
  (<Type>() => Type extends Actual ? 1 : 2) extends <Type>() => Type extends Expected ? 1 : 2 ? true : false;

type ExpectTrue<Type extends true> = Type;

interface NestedJsonValue {
  readonly enabled: boolean;
  readonly label: LabelValueObject;
}

interface ComplexJsonValue {
  readonly nested: NestedJsonValue;
  readonly tags: LabelValueObject[];
  readonly measuredLabel: ValueWithSibling;
}

class LabelValueObject {
  constructor(public readonly value: string) {}

  public equals(other: LabelValueObject): boolean {
    return this.value === other.value;
  }
}

class NestedLabelValueObject {
  constructor(public readonly value: LabelValueObject) {}
}

interface ValueWithSibling {
  readonly value: LabelValueObject;
  readonly unit: string;
}

class ComplexJsonValueObject {
  constructor(public readonly value: ComplexJsonValue) {}
}

class Metadata {
  constructor(
    public readonly publishedAt: Date,
    public readonly owner: LabelValueObject
  ) {}

  public touch(): Date {
    return this.publishedAt;
  }
}

class Domain {
  constructor(
    public readonly id: LabelValueObject,
    public readonly metadata: Metadata,
    public readonly config: ComplexJsonValueObject,
    public readonly children: Metadata[],
    public readonly createdAt: Date
  ) {}

  public rename(id: LabelValueObject): Domain {
    return new Domain(id, this.metadata, this.config, this.children, this.createdAt);
  }
}

interface MethodOnlyObject {
  readonly label: LabelValueObject;
  format(): string;
}

describe('Primitives type should', () => {
  it('unwrap value objects recursively and preserve complex properties', () => {
    type DomainPrimitiveOutput = Primitives<Domain>;
    type PrimitivesMatchExpectedOutput = ExpectTrue<IsTypeEqual<DomainPrimitiveOutput, ExpectedDomainPrimitives>>;

    expectTypeOf<DomainPrimitiveOutput>().toEqualTypeOf<ExpectedDomainPrimitives>();
    expectTypeOf<PrimitivesMatchExpectedOutput>().toEqualTypeOf<true>();
  });

  it('unwraps value objects only when value is the only non-method property', () => {
    type ValueObjectPrimitiveOutput = Primitives<NestedLabelValueObject>;
    type PlainObjectPrimitiveOutput = Primitives<ValueWithSibling>;

    type ValueObjectMatchExpectedOutput = ExpectTrue<IsTypeEqual<ValueObjectPrimitiveOutput, string>>;
    type PlainObjectMatchExpectedOutput = ExpectTrue<
      IsTypeEqual<PlainObjectPrimitiveOutput, ExpectedValueWithSiblingPrimitive>
    >;

    expectTypeOf<ValueObjectPrimitiveOutput>().toEqualTypeOf<string>();
    expectTypeOf<PlainObjectPrimitiveOutput>().toEqualTypeOf<ExpectedValueWithSiblingPrimitive>();
    expectTypeOf<ValueObjectMatchExpectedOutput>().toEqualTypeOf<true>();
    expectTypeOf<PlainObjectMatchExpectedOutput>().toEqualTypeOf<true>();
  });

  it('preserves dates while stripping methods from object primitive output', () => {
    type MetadataPrimitiveOutput = Primitives<Metadata>;
    type MethodOnlyPrimitiveOutput = Primitives<MethodOnlyObject>;

    expectTypeOf<MetadataPrimitiveOutput>().toEqualTypeOf<ExpectedMetadataPrimitives>();
    expectTypeOf<MetadataPrimitiveOutput>().not.toHaveProperty('touch');
    expectTypeOf<MethodOnlyPrimitiveOutput>().toEqualTypeOf<{ readonly label: string }>();
    expectTypeOf<MethodOnlyPrimitiveOutput>().not.toHaveProperty('format');
  });

  it('maps arrays recursively', () => {
    type ArrayPrimitiveOutput = Primitives<readonly NestedLabelValueObject[]>;

    expectTypeOf<ArrayPrimitiveOutput>().toEqualTypeOf<string[]>();
  });
});
