import { OrderType, OrderTypes } from '../../../../../../src/Contexts/Shared/domain/criteria/OrderType.js';
import { EnumMother } from '../value-object/EnumMother.js';

export class OrderTypeMother {
  static create(type: string): OrderType {
    return OrderType.fromValue(type);
  }

  static random(): OrderType {
    return OrderTypeMother.create(EnumMother.randomFromEnum(OrderTypes));
  }
}
