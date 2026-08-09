import { describe, it, beforeEach } from 'vitest';
import { UserRegister } from '@Contexts/Identity/User/application/register/UserRegister.js';
import { UserMother } from '../../domain/UserMother.js';
import { RegisterUserCommandMother } from './RegisterUserCommandMother.js';
import { RegisterUserCommandHandler } from '@Contexts/Identity/User/application/register/RegisterUserCommandHandler.js';
import { UserRegisterTestCase } from './UserRegisterTestCase.js';
import { UserAlreadyExistsException } from '@Contexts/Identity/User/domain/exception/UserAlreadyExistsException.js';

describe('UserRegister should', () => {
  let testCase: UserRegisterTestCase;
  let commandHandler: RegisterUserCommandHandler;

  beforeEach(() => {
    testCase = new UserRegisterTestCase();
    const useCase = new UserRegister(
      testCase.logger(),
      testCase.persistenceRepository(),
      testCase.passwordEncryptor(),
      testCase.eventBus()
    );
    commandHandler = new RegisterUserCommandHandler(useCase);
  });

  it('create a valid user', async () => {
    const command = RegisterUserCommandMother.create();

    // No existing user found by email
    testCase.shouldMatching();
    testCase.shouldHashPassword(command.password, 'hashed-password');
    testCase.shouldSaveWithId(command.id);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
  });

  it('throw an exception when the user already exists', async () => {
    const model = UserMother.create();
    const command = RegisterUserCommandMother.fromModel(model);

    // Existing user found by email
    testCase.shouldMatching(model);

    await testCase.assertSaveException(command, commandHandler, UserAlreadyExistsException);
  });
});
