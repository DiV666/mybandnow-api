import { FilterField } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterField.js';
import { WordMother } from '../value-object/WordMother.js';

export class FilterFieldMother {
  static create(field?: string): FilterField {
    return new FilterField(field || WordMother.random());
  }
}
