import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { BandListMembers } from './BandListMembers.js';
import { BandListMembersQuery } from './BandListMembersQuery.js';
import { BandListMembersResponse } from './BandListMembersResponse.js';

export class BandListMembersQueryHandler implements QueryHandler<BandListMembersQuery, BandListMembersResponse> {
  constructor(private readonly useCase: BandListMembers) {}

  subscribedTo(): Query {
    return BandListMembersQuery;
  }

  handle(query: BandListMembersQuery): Promise<BandListMembersResponse> {
    return this.useCase.run(query);
  }
}
