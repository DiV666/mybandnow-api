import { describe, it, beforeEach, expect } from 'vitest';
import { MusicianFindById } from '@Contexts/Musician/application/findById/MusicianFindById.js';
import { MusicianFindByIdQueryHandler } from '@Contexts/Musician/application/findById/MusicianFindByIdQueryHandler.js';
import { MusicianFindByIdQuery } from '@Contexts/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianMother } from '../../domain/MusicianMother.js';
import { MusicianFindByIdTestCase } from './MusicianFindByIdTestCase.js';
import { MusicianFindByIdResponseMother } from './MusicianFindByIdResponseMother.js';
import { MusicianNotExistException } from '@Contexts/Musician/domain/exception/MusicianNotExistException.js';

describe('MusicianFindById should', () => {
  let testCase: MusicianFindByIdTestCase;
  let queryHandler: MusicianFindByIdQueryHandler;

  beforeEach(() => {
    testCase = new MusicianFindByIdTestCase();
    const useCase = new MusicianFindById(testCase.repository());
    queryHandler = new MusicianFindByIdQueryHandler(useCase);
  });

  it('find an existing musician', async () => {
    // Arrange
    const model = MusicianMother.create();
    const response = MusicianFindByIdResponseMother.fromModel(model);
    const query = new MusicianFindByIdQuery(model.id.value);

    testCase.shouldSearch(model.id, model);

    // Act
    const result = await queryHandler.handle(query);

    // Assert
    expect(result).toEqual(response);
    testCase.assertSearch(model);
  });

  it('throw an error if musician does not exist', async () => {
    // Arrange
    const model = MusicianMother.create();
    const query = new MusicianFindByIdQuery(model.id.value);

    testCase.shouldSearch(model.id);

    // Act / Assert
    await expect(queryHandler.handle(query)).rejects.toThrow(MusicianNotExistException);
    testCase.assertSearch(null);
  });
});
