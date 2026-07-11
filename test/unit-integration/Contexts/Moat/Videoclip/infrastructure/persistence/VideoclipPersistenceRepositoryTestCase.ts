import { expect } from 'vitest';
import { Videoclip } from '../../../../../../../src/Contexts/Moat/Videoclip/domain/Videoclip.js';
import { Nullable } from '../../../../../../../src/Contexts/Shared/domain/Nullable.js';
import { TestCase } from '../../../../../../utils/TestCase.js';

export class VideoclipPersistenceRepositoryTestCase extends TestCase {
  assertSimilar(created: Nullable<Videoclip>, expected: Videoclip): void {
    expect(created as unknown as Record<string, unknown>).toEqual(
      this.similarTo(expected as unknown as Record<string, unknown>, {
        exclude: ['createdAt', 'updatedAt', 'domainEvents']
      })
    );
  }
}
