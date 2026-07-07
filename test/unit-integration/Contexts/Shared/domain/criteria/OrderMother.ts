import { Order } from '../../../../../../src/Contexts/Shared/domain/criteria/Order.js';
import { OrderByMother } from './OrderByMother.js';
import { OrderTypeMother } from './OrderTypeMother.js';

export class OrderMother {
  private static defaults: Partial<Order> = {
    orderBy: OrderByMother.random(),
    orderType: OrderTypeMother.random()
  };

  static create(...params: Partial<Order>[]): Order {
    const order: Order = Object.assign({}, OrderMother.defaults, ...params);
    return new Order(order.orderBy, order.orderType);
  }

  static random(): Order {
    return OrderMother.create();
  }

  static none() {
    return Order.none();
  }
}
