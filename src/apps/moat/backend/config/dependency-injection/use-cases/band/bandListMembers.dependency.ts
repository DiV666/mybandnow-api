import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandListMembers } from '@Contexts/Moat/Band/application/listMembers/BandListMembers.js';
import { BandListMembersQueryHandler } from '@Contexts/Moat/Band/application/listMembers/BandListMembersQueryHandler.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Moat.Band.BandListMembers', BandListMembers)
    .addArgument(new Reference('Moat.Band.BandRepository'));

  container
    .register('Moat.Band.BandListMembersQueryHandler', BandListMembersQueryHandler)
    .addArgument(new Reference('Moat.Band.BandListMembers'))
    .addTag('queryHandler');
};
