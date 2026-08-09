import bcrypt from 'bcryptjs';
import { PasswordEncryptor } from '../../domain/service/PasswordEncryptor.js';

export class BcryptPasswordEncryptor implements PasswordEncryptor {
  async match(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
}
