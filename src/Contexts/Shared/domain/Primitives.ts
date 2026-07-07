export type Methods<T> = {
  [P in keyof T]: T[P] extends CallableFunction ? P : never;
}[keyof T];

export type MethodsAndProperties<T> = { [key in keyof T]: T[key] };

export type Properties<T> = Omit<MethodsAndProperties<T>, Methods<T>>;

export type NativePrimitive = string | number | boolean | bigint | symbol | null | undefined;

export type HasOnlyValueProperty<T> = keyof Properties<T> extends 'value'
  ? 'value' extends keyof Properties<T>
    ? true
    : false
  : false;

export type PrimitiveValue<T> = T extends NativePrimitive
  ? T
  : [T] extends [Date]
    ? Date
    : T extends Array<infer Item>
      ? PrimitiveValue<Item>[]
      : T extends ReadonlyArray<infer Item>
        ? PrimitiveValue<Item>[]
        : T extends object
          ? HasOnlyValueProperty<T> extends true
            ? T extends { readonly value: infer Value }
              ? PrimitiveValue<Value>
              : never
            : ValueObjectValue<Properties<T>>
          : T;

export type ValueObjectValue<T> = {
  [key in keyof T]: PrimitiveValue<T[key]>;
};

export type Primitives<T> = PrimitiveValue<T>;
