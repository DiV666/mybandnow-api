import { UserIdMother } from '../../domain/UserIdMother.js';
import { RegisterUserCommand } from '@Contexts/Identity/User/application/register/RegisterUserCommand.js';
import { User } from '@Contexts/Identity/User/domain/User.js';

export class RegisterUserCommandMother {
  static create(params?: { id?: string; email?: string; password?: string }): RegisterUserCommand {
    const defaults = {
      id: UserIdMother.random().value,
      email: 'test@example.com',
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords
      password: 'password123'
    };
    const commandData = { ...defaults, ...params };
    return new RegisterUserCommand(commandData.id, commandData.email, commandData.password);
  }

  static fromModel(model: User): RegisterUserCommand {
    return RegisterUserCommandMother.create({
      id: model.id.value,
      email: model.email.value,

      password: model.password.value
    });
  }
}
