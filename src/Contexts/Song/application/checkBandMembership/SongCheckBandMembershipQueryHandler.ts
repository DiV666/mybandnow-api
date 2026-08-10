import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SongCheckBandMembership } from './SongCheckBandMembership.js';
import { SongCheckBandMembershipQuery } from './SongCheckBandMembershipQuery.js';
import { SongCheckBandMembershipResponse } from './SongCheckBandMembershipResponse.js';

export class SongCheckBandMembershipQueryHandler implements QueryHandler<
  SongCheckBandMembershipQuery,
  SongCheckBandMembershipResponse
> {
  constructor(private readonly useCase: SongCheckBandMembership) {}

  subscribedTo(): Query {
    return SongCheckBandMembershipQuery;
  }

  handle(query: SongCheckBandMembershipQuery): Promise<SongCheckBandMembershipResponse> {
    return this.useCase.run(query);
  }
}
