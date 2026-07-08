import { describe, it, beforeEach } from 'vitest';
import { UserLogin } from '@Contexts/Mybandnow/User/application/login/UserLogin.js';
import { UserMother } from '../../domain/UserMother.js';
import { UserLoginTestCase } from './UserLoginTestCase.js';
import { UserNotExistException } from '@Contexts/Mybandnow/User/domain/exception/UserNotExistException.js';
import { InvalidCredentialsException } from '@Contexts/Mybandnow/User/domain/exception/InvalidCredentialsException.js';
import { LoginUserQuery } from '@Contexts/Mybandnow/User/application/login/LoginUserQuery.js';
import { LoginUserResponse } from '@Contexts/Mybandnow/User/application/login/LoginUserResponse.js';

describe('UserLogin should', () => {
  let testCase: UserLoginTestCase;
  let useCase: UserLogin;

  beforeEach(() => {
    testCase = new UserLoginTestCase();
    useCase = new UserLogin(testCase.persistenceRepository(), testCase.jwtGenerator(), testCase.passwordEncryptor());
  });

  it('generate jwt when credentials are correct', async () => {
    // the plaintext password will be 'password', we just need a user whose password matches it
    // Wait, UserMother.create() uses random string for password.
    // We should create a user with a hashed password that matches "mypassword"
    const plainPassword = 'mypassword';
    const model = UserMother.create();
    testCase.shouldMatchPassword(plainPassword, model.password.value, true);

    const query = new LoginUserQuery(model.email.value, plainPassword);
    const expectedToken = 'jwt-token';
    const response = new LoginUserResponse(expectedToken);

    testCase.shouldMatching(model);
    testCase.shouldGenerateJwt(model.id, model.email, expectedToken);

    await testCase.assertRunResponse(response, query, useCase);
  });

  it('throw an error if user does not exist', async () => {
    const query = new LoginUserQuery('test@example.com', 'password');
    testCase.shouldMatching(null);
    await testCase.assertRunException(query, useCase, InvalidCredentialsException);
  });

  it('throw an error if password does not match', async () => {
    const model = UserMother.create();
    const plainPassword = 'wrong-password';
    const query = new LoginUserQuery(model.email.value, plainPassword);

    testCase.shouldMatchPassword(plainPassword, model.password.value, false);

    testCase.shouldMatching(model);
    await testCase.assertRunException(query, useCase, InvalidCredentialsException);
  });
});
