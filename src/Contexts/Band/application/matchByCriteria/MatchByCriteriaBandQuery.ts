import { Query } from '@Contexts/Shared/domain/Query.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

export class MatchByCriteriaBandQuery implements Query {
  constructor(
    readonly authenticatedUser: AuthenticatedUserContext,
    readonly criteria: Criteria
  ) {}
}
