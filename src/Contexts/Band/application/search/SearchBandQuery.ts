import { Query } from '@Contexts/Shared/domain/Query.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

export class SearchBandQuery implements Query {
  constructor(
    readonly authenticatedUser: AuthenticatedUserContext,
    readonly id: string
  ) {}
}
