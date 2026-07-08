import { UserIdMother } from '../../domain/UserIdMother.js';
import { RegisterUserCommand } from '@Contexts/Mybandnow/User/application/register/RegisterUserCommand.js';
import { User } from '@Contexts/Mybandnow/User/domain/User.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

const defaultAuthenticatedUser: AuthenticatedUserContext = {
  userId: 'test-user-id',
  companyId: 'test-company-id',
  partnerId: 'test-partner-id',
  roles: ['admin-scope']
};

export class RegisterUserCommandMother {
  static create(params?: {
    id?: string;
    email?: string;
    password?: string;
    authenticatedUser?: AuthenticatedUserContext;
  }): RegisterUserCommand {
    const defaults = {
      id: UserIdMother.random().value,
      email: 'test@example.com',
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords
      password: 'password123',
      authenticatedUser: defaultAuthenticatedUser
    };
    const commandData = { ...defaults, ...params };
    return new RegisterUserCommand(
      commandData.authenticatedUser,
      commandData.id,
      commandData.email,
      commandData.password
    );
  }

  static fromModel(model: User): RegisterUserCommand {
    return RegisterUserCommandMother.create({
      id: model.id.value,
      email: model.email.value,

      password: model.password.value
    });
  }
}
