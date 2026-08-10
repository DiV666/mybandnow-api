import { expect } from 'vitest';
import { Song } from '@Contexts/Song/domain/Song.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class SongPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<Song>, expected: Song): void {
    expect(created).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['domainEvents']
      })
    );
  }
}
