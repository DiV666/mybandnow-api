import { expect } from 'vitest';
import { Band } from '@Contexts/Band/domain/Band.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class BandPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<Band>, expected: Band): void {
    expect(created).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['createdAt', 'updatedAt', 'domainEvents']
      })
    );
  }
}
