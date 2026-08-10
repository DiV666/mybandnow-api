import { describe, it, beforeEach, expect } from 'vitest';
import { MusicianSearchByUserIdTestCase } from './MusicianSearchByUserIdTestCase.js';
import { MusicianSearchByUserId } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { MusicianSearchByUserIdQueryHandler } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQueryHandler.js';
import { MusicianMother } from '../../domain/MusicianMother.js';
import { MusicianSearchByUserIdQueryMother } from './MusicianSearchByUserIdQueryMother.js';
import { MusicianUserId } from '@Contexts/Musician/domain/value-object/MusicianUserId.js';

describe('MusicianSearchByUserId should', () => {
  let testCase: MusicianSearchByUserIdTestCase;
  let queryHandler: MusicianSearchByUserIdQueryHandler;

  beforeEach(() => {
    testCase = new MusicianSearchByUserIdTestCase();
    const useCase = new MusicianSearchByUserId(testCase.repository());
    queryHandler = new MusicianSearchByUserIdQueryHandler(useCase);
  });

  it('return musician when it exists', async () => {
    // Arrange
    const musician = MusicianMother.random();
    const query = MusicianSearchByUserIdQueryMother.create({ userId: musician.userId.value });

    testCase.shouldSearchByUserId(musician.userId, musician);

    // Act
    const response = await queryHandler.handle(query);

    // Assert
    expect(response.musician).toEqual(musician.toPrimitives());
    testCase.assertSearchByUserId(musician);
  });

  it('return null when it does not exist', async () => {
    // Arrange
    const query = MusicianSearchByUserIdQueryMother.create();
    const userId = new MusicianUserId(query.userId);

    testCase.shouldSearchByUserId(userId);

    // Act
    const response = await queryHandler.handle(query);

    // Assert
    expect(response.musician).toBeNull();
    testCase.assertSearchByUserId(null);
  });
});
