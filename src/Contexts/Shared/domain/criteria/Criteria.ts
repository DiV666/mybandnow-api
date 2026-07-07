import { Filter } from './Filter.js';
import { Filters, type FilterValueType } from './Filters.js';
import { Order } from './Order.js';

export interface CriteriaPrimitives {
  filters: Array<Record<string, FilterValueType>>;
  orderBy: string;
  orderType: string;
  limit?: number;
  offset?: number;
}
export class Criteria {
  readonly filters: Filters;
  readonly order: Order;
  readonly limit?: number;
  readonly offset?: number;

  constructor(filters: Filters, order: Order, limit?: number, offset?: number) {
    this.filters = filters;
    this.order = order;
    this.limit = limit;
    this.offset = offset;
  }

  public hasFilters(): boolean {
    return this.filters.filters.length > 0;
  }

  toPrimitives(): CriteriaPrimitives {
    return {
      filters: this.filters.toPrimitives(),
      orderBy: this.order.orderBy.value,
      orderType: this.order.orderType.value,
      limit: this.limit,
      offset: this.offset
    };
  }

  static fromPrimitives(plainData: CriteriaPrimitives): Criteria {
    const filters = plainData.filters.map((filter) => Filter.fromValues(filter));
    return new Criteria(
      new Filters(filters),
      Order.fromValues(plainData.orderBy, plainData.orderType),
      plainData.limit,
      plainData.offset
    );
  }
}
