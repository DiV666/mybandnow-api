import jsonwebtoken from 'jsonwebtoken';
import { JwtGenerator } from '../../domain/service/JwtGenerator.js';
import { UserId } from '../../domain/value-object/UserId.js';
import { UserEmail } from '../../domain/value-object/UserEmail.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export class LocalJwtGenerator implements JwtGenerator {
  async generate(id: UserId, email: UserEmail): Promise<string> {
    const secret = env.JWT_SECRET;

    return new Promise((resolve, reject) => {
      jsonwebtoken.sign(
        { email: email.value },
        secret,
        {
          algorithm: 'HS256',
          expiresIn: '24h',
          subject: id.value
        },
        (err, token) => {
          if (err || !token) {
            reject(err || new Error('Failed to generate JWT'));
          } else {
            resolve(token);
          }
        }
      );
    });
  }
}
