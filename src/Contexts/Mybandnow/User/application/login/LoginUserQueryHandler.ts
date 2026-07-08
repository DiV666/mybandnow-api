import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { LoginUserQuery } from './LoginUserQuery.js';
import { UserLogin } from './UserLogin.js';
import { LoginUserResponse } from './LoginUserResponse.js';

export class LoginUserQueryHandler implements QueryHandler<LoginUserQuery, LoginUserResponse> {
  constructor(private useCase: UserLogin) {}

  subscribedTo(): Query {
    return LoginUserQuery;
  }

  async handle(query: LoginUserQuery): Promise<LoginUserResponse> {
    return this.useCase.run({ email: query.email, password: query.password });
  }
}
