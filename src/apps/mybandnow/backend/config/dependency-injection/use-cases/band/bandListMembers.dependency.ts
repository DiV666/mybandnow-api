import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandListMembers } from '@Contexts/Band/application/listMembers/BandListMembers.js';
import { BandListMembersQueryHandler } from '@Contexts/Band/application/listMembers/BandListMembersQueryHandler.js';

export const register = (container: ContainerBuilder) => {
  container.register('Band.BandListMembers', BandListMembers).addArgument(new Reference('Band.BandRepository'));

  container
    .register('Band.BandListMembersQueryHandler', BandListMembersQueryHandler)
    .addArgument(new Reference('Band.BandListMembers'))
    .addTag('queryHandler');
};
