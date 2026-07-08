import { Query } from '@Contexts/Shared/domain/Query.js';

export class LoginUserQuery implements Query {
  constructor(
    readonly email: string,
    readonly password: string
  ) {}
}
