import { describe, expect, it } from 'vitest';

import { CriteriaScopeSecurity } from '../../../../../../src/Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import type { AuthenticatedUserContext } from '../../../../../../src/Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { Criteria } from '../../../../../../src/Contexts/Shared/domain/criteria/Criteria.js';
import { Filter } from '../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterOperator.js';
import { Filters } from '../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';
import { FilterValue } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '../../../../../../src/Contexts/Shared/domain/criteria/Order.js';

describe('CriteriaScopeSecurity', () => {
  it('replaces existing scope filters with the authenticated partner scope filter', () => {
    // Arrange
    const security = new CriteriaScopeSecurity();
    const criteria = new Criteria(
      new Filters([
        createFilter('companyId', 'other-company'),
        createFilter('userId', 'other-user'),
        createFilter('status', 'ACTIVE')
      ]),
      Order.none(),
      25,
      10
    );

    const user = createUser({
      partnerId: 'partner-123',
      roles: ['partner-scope']
    });

    // Act
    const securedCriteria = security.apply(criteria, user);

    // Assert
    expect(securedCriteria.toPrimitives()).toEqual({
      filters: [
        {
          field: 'status',
          operator: 'EQUAL',
          value: 'ACTIVE',
          type: 'string',
          sensitive: false
        },
        {
          field: 'partnerId',
          operator: 'EQUAL',
          value: 'partner-123',
          type: 'string',
          sensitive: false
        }
      ],
      orderBy: '',
      orderType: 'none',
      limit: 25,
      offset: 10
    });
  });

  it('returns the original criteria for admin-scope users', () => {
    // Arrange
    const security = new CriteriaScopeSecurity();
    const criteria = new Criteria(new Filters([createFilter('status', 'ACTIVE')]), Order.asc('createdAt'), 50, 0);
    const user = createUser({ roles: ['admin-scope'] });

    // Act
    const securedCriteria = security.apply(criteria, user);

    // Assert
    expect(securedCriteria).toBe(criteria);
  });

  it('applies the authenticated company scope filter and preserves non-scope filters', () => {
    // Arrange
    const security = new CriteriaScopeSecurity();
    const criteria = new Criteria(
      new Filters([createFilter('partnerId', 'other-partner'), createFilter('status', 'PENDING')]),
      Order.none()
    );
    const user = createUser({ companyId: 'company-999', roles: ['company-scope'] });

    // Act
    const securedCriteria = security.apply(criteria, user);

    // Assert
    expect(securedCriteria.toPrimitives().filters).toEqual([
      {
        field: 'status',
        operator: 'EQUAL',
        value: 'PENDING',
        type: 'string',
        sensitive: false
      },
      {
        field: 'companyId',
        operator: 'EQUAL',
        value: 'company-999',
        type: 'string',
        sensitive: false
      }
    ]);
  });

  it('falls back to the authenticated user scope filter when no broader scope role is present', () => {
    // Arrange
    const security = new CriteriaScopeSecurity();
    const criteria = new Criteria(new Filters([createFilter('companyId', 'other-company')]), Order.none());
    const user = createUser({ userId: 'user-999', roles: ['some-other-role'] });

    // Act
    const securedCriteria = security.apply(criteria, user);

    // Assert
    expect(securedCriteria.toPrimitives().filters).toEqual([
      {
        field: 'userId',
        operator: 'EQUAL',
        value: 'user-999',
        type: 'string',
        sensitive: false
      }
    ]);
  });
});

function createFilter(field: string, value: string): Filter {
  return new Filter(new FilterField(field), FilterOperator.fromValue('EQUAL'), new FilterValue(value));
}

function createUser(params?: Partial<AuthenticatedUserContext>): AuthenticatedUserContext {
  return {
    userId: 'user-123',
    companyId: 'company-123',
    partnerId: 'partner-123',
    roles: [],
    ...params
  };
}
