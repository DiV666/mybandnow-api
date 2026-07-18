import { expect } from 'vitest';
import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class InstrumentsPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<Instruments>, expected: Instruments): void {
    expect(created).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['createdAt', 'updatedAt', 'domainEvents']
      })
    );
  }
}
