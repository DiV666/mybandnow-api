import { UserId } from '../value-object/UserId.js';
import { UserEmail } from '../value-object/UserEmail.js';

export interface JwtGenerator {
  generate(id: UserId, email: UserEmail): Promise<string>;
}
