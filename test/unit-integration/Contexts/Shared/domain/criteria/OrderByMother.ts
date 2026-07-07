import { OrderBy } from '../../../../../../src/Contexts/Shared/domain/criteria/OrderBy.js';

export class OrderByMother {
  static create(fieldName: string): OrderBy {
    return new OrderBy(fieldName);
  }

  static random(): OrderBy {
    // NOTE: Could potentially detect database fields dynamically, but 'name' is a safe default for testing
    return OrderByMother.create('name');
  }
}
