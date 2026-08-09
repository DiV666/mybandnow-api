import { expect } from 'vitest';
import { User } from '@Contexts/Identity/User/domain/User.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class UserPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<User>, expected: User): void {
    expect(created).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['createdAt', 'updatedAt', 'domainEvents']
      })
    );
  }
}
