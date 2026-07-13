import { expect } from 'vitest';
import { SongInstrumentVideo } from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class SongInstrumentVideoPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<SongInstrumentVideo>, expected: SongInstrumentVideo): void {
    expect(created).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['createdAt', 'updatedAt', 'domainEvents']
      })
    );
  }
}
