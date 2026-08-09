import { InvalidCredentialsException } from '../../domain/exception/InvalidCredentialsException.js';
import { LoginUserResponse } from './LoginUserResponse.js';
import { LoginUserQuery } from './LoginUserQuery.js';
import { UserPersistenceRepository } from '../../domain/repository/UserPersistenceRepository.js';
import { JwtGenerator } from '../../domain/service/JwtGenerator.js';
import { PasswordEncryptor } from '../../domain/service/PasswordEncryptor.js';
import { UserEmail } from '../../domain/value-object/UserEmail.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order as CriteriaOrder } from '@Contexts/Shared/domain/criteria/Order.js';

export class UserLogin {
  constructor(
    private repository: UserPersistenceRepository,
    private jwtGenerator: JwtGenerator,
    private passwordEncryptor: PasswordEncryptor
  ) {}

  async run(query: LoginUserQuery): Promise<LoginUserResponse> {
    const email = new UserEmail(query.email);

    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('email'), FilterOperator.equal(), new FilterValue(email.value))]),
      CriteriaOrder.none()
    );

    const [user] = await this.repository.matching(criteria);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await this.passwordEncryptor.match(query.password, user.password.value);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const token = await this.jwtGenerator.generate(user.id, user.email);

    return new LoginUserResponse(token);
  }
}
