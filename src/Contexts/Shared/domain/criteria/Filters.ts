import { Filter } from './Filter.js';

export type FilterPrimitive = string | number | boolean;
export type FilterValueType = FilterPrimitive | Array<FilterPrimitive>;

export class Filters {
  readonly filters: Array<Filter>;

  constructor(filters: Array<Filter>) {
    this.filters = filters;
  }

  toPrimitives(): Array<Record<string, FilterValueType>> {
    return this.filters.map((filter: Filter) => {
      return {
        field: filter.field.value,
        operator: filter.operator.value,
        value: filter.value.value,
        type: filter.type.value,
        sensitive: filter.sensitive ?? false
      };
    });
  }

  static fromValues(filters: Array<Record<string, FilterValueType>>): Filters {
    return new Filters(filters.map(Filter.fromValues));
  }

  static none(): Filters {
    return new Filters([]);
  }
}
