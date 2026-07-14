import { Criteria } from '../../domain/criteria/Criteria.js';
import { Filter } from '../../domain/criteria/Filter.js';
import { FilterField } from '../../domain/criteria/FilterField.js';
import { FilterOperator } from '../../domain/criteria/FilterOperator.js';
import { Filters } from '../../domain/criteria/Filters.js';
import { FilterValue } from '../../domain/criteria/FilterValue.js';
import { AuthenticatedUserContext } from './AuthenticatedUserContext.js';

export class CriteriaScopeSecurity {
  private static readonly SECURED_SCOPE_FIELDS = new Set(['userId']);

  public apply(criteria: Criteria, user: AuthenticatedUserContext): Criteria {
    const { roles, id } = user;

    if (roles.includes('admin-scope')) {
      return criteria;
    }

    const scopeFilter = new Filter(new FilterField('userId'), FilterOperator.fromValue('EQUAL'), new FilterValue(id));

    const nonScopedFilters = criteria.filters.filters.filter(
      (filter) => !CriteriaScopeSecurity.SECURED_SCOPE_FIELDS.has(filter.field.value)
    );
    const newFilters = new Filters([...nonScopedFilters, scopeFilter]);

    return new Criteria(newFilters, criteria.order, criteria.limit, criteria.offset);
  }
}
