import { BandIdMother } from '../../domain/BandIdMother.js';
import { UpdateBandCommand } from '@Contexts/Moat/Band/application/update/UpdateBandCommand.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { BandNameMother } from '../../domain/BandNameMother.js';
import { BandOwnerIdMother } from '../../domain/BandOwnerIdMother.js';

const defaultAuthenticatedUser: AuthenticatedUserContext = {
  userId: 'test-user-id',
  companyId: 'test-company-id',
  partnerId: 'test-partner-id',
  roles: ['admin-scope']
};

export class UpdateBandCommandMother {
  static create(params?: {
    id?: string;
    authenticatedUser?: AuthenticatedUserContext;
    name?: string;
    ownerId?: string;
  }): UpdateBandCommand {
    const defaults = {
      id: BandIdMother.random().value,
      authenticatedUser: defaultAuthenticatedUser,
      name: BandNameMother.random().value,
      ownerId: BandOwnerIdMother.random().value
    };
    const commandData = { ...defaults, ...params };
    return new UpdateBandCommand(commandData.authenticatedUser, commandData.id, commandData.name);
  }

  static fromModel(model: Band): UpdateBandCommand {
    return UpdateBandCommandMother.create({
      id: model.id.value,
      name: model.name.value,
      ownerId: model.ownerId.value
    });
  }
}
