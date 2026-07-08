export interface PasswordEncryptor {
  match(plain: string, hashed: string): Promise<boolean>;
  hash(plain: string): Promise<string>;
}
