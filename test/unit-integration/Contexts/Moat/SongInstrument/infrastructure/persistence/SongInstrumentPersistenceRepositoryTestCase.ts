import { expect } from 'vitest';
import { SongInstrument } from '@Contexts/Moat/SongInstrument/domain/SongInstrument.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class SongInstrumentPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<SongInstrument>, expected: SongInstrument): void {
    expect(created).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['createdAt', 'updatedAt', 'domainEvents']
      })
    );
  }
}
