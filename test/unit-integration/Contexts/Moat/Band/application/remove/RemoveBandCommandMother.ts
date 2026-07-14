import { BandIdMother } from '../../domain/BandIdMother.js';
import { RemoveBandCommand } from '@Contexts/Moat/Band/application/remove/RemoveBandCommand.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

const defaultAuthenticatedUser: AuthenticatedUserContext = {
  id: 'test-user-id',
  roles: ['admin-scope']
};

export class RemoveBandCommandMother {
  static create(params?: Partial<{ id: string; authenticatedUser: AuthenticatedUserContext }>): RemoveBandCommand {
    const data = {
      id: BandIdMother.random().value,
      authenticatedUser: defaultAuthenticatedUser,
      ...params
    };
    return new RemoveBandCommand(data.authenticatedUser, data.id);
  }

  static fromModel(model: Band): RemoveBandCommand {
    return this.create({ id: model.id.value });
  }
}
