import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { UserLogin } from '@Contexts/Identity/User/application/login/UserLogin.js';
import { LoginUserResponse } from '@Contexts/Identity/User/application/login/LoginUserResponse.js';
import { LoginUserQuery } from '@Contexts/Identity/User/application/login/LoginUserQuery.js';
import { User } from '@Contexts/Identity/User/domain/User.js';
import { UserPersistenceRepository } from '@Contexts/Identity/User/domain/repository/UserPersistenceRepository.js';
import { JwtGenerator } from '@Contexts/Identity/User/domain/service/JwtGenerator.js';
import { PasswordEncryptor } from '@Contexts/Identity/User/domain/service/PasswordEncryptor.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { UserEmail } from '@Contexts/Identity/User/domain/value-object/UserEmail.js';
import { UserId } from '@Contexts/Identity/User/domain/value-object/UserId.js';

export class UserLoginTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<UserPersistenceRepository>> = null;
  private _jwtGenerator: Nullable<MockProxy<JwtGenerator>> = null;
  private _passwordEncryptor: Nullable<MockProxy<PasswordEncryptor>> = null;
  private persistenceRepositoryMock: Mock = new Mock();
  private jwtGeneratorMock: Mock = new Mock();
  private passwordEncryptorMock: Mock = new Mock();

  shouldMatching(data?: User | null): void {
    this.persistenceRepositoryMock
      .shouldReceive(this.persistenceRepository().matching)
      .once()
      .withArgs(expect.any(Criteria))
      .andReturn(data ? [data] : []);
  }

  shouldGenerateJwt(id: UserId, email: UserEmail, token: string): void {
    this.jwtGeneratorMock
      .shouldReceive(this.jwtGenerator().generate)
      .once()
      .withArgs(expect.objectContaining({ value: id.value }), expect.objectContaining({ value: email.value }))
      .andReturn(token);
  }

  shouldMatchPassword(plain: string, hashed: string, result: boolean): void {
    this.passwordEncryptorMock
      .shouldReceive(this.passwordEncryptor().match)
      .once()
      .withArgs(plain, hashed)
      .andReturn(result);
  }

  assertMatching(data: null) {
    this.persistenceRepositoryMock.expect(data);
  }

  assertGenerateJwt(data: null) {
    this.jwtGeneratorMock.expect(data);
  }

  async assertRunResponse(expected: LoginUserResponse, query: LoginUserQuery, applicationService: UserLogin) {
    const model = await applicationService.run(query);
    expect(model).toEqual(expected);
  }

  async assertRunException(
    query: LoginUserQuery,
    applicationService: UserLogin,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ): Promise<void> {
    await this.assertThrows(async () => await applicationService.run(query), Exception);
  }

  jwtGenerator(): MockProxy<JwtGenerator> {
    if (!this._jwtGenerator) {
      this._jwtGenerator = mock<JwtGenerator>();
    }
    return this._jwtGenerator;
  }

  passwordEncryptor(): MockProxy<PasswordEncryptor> {
    if (!this._passwordEncryptor) {
      this._passwordEncryptor = mock<PasswordEncryptor>();
    }
    return this._passwordEncryptor;
  }

  persistenceRepository(): MockProxy<UserPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<UserPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
