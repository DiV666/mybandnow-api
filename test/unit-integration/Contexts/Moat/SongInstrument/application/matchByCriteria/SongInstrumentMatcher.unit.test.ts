import { beforeEach, describe, expect, it } from 'vitest';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentMatcher } from '@Contexts/Moat/SongInstrument/application/matchByCriteria/SongInstrumentMatcher.js';
import { mock } from 'vitest-mock-extended';
import { SongInstrumentMother } from '../../domain/SongInstrumentMother.js';
import { SongInstrumentMatcherTestCase } from './SongInstrumentMatcherTestCase.js';
import { MatchByCriteriaSongInstrumentResponseMother } from './MatchByCriteriaSongInstrumentResponseMother.js';
import { SongInstrumentMatchByCriteriaCriteriaMother } from './SongInstrumentMatchByCriteriaCriteriaMother.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { SongInstrumentUploadPersistenceRepository } from '@Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadMother } from '@Test/unit-integration/Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusValues } from '@Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentActiveUploadAttemptId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentActiveUploadAttemptId.js';

describe('SongInstrumentMatcher should', () => {
  let testCase: SongInstrumentMatcherTestCase;
  let useCase: SongInstrumentMatcher;

  beforeEach(() => {
    testCase = new SongInstrumentMatcherTestCase();
    useCase = new SongInstrumentMatcher(
      testCase.persistenceRepository(),
      testCase.authorizationRepository(),
      mock<SongInstrumentUploadPersistenceRepository>()
    );
  });

  it('find a songinstrument list scoped to the requested song for an authorized band member', async () => {
    const model = SongInstrumentMother.create();
    const criteria = SongInstrumentMatchByCriteriaCriteriaMother.withConflictingSongScope(
      '48baf7d0-b8d5-4831-b0a8-997a23f17001',
      model.instrumentId.value
    );
    const scopedCriteria = SongInstrumentMatchByCriteriaCriteriaMother.forSongAndInstrumentId(
      model.songId.value,
      model.instrumentId.value,
      criteria.order,
      criteria.limit,
      criteria.offset
    );
    const response = MatchByCriteriaSongInstrumentResponseMother.fromModelList([model]);

    testCase.shouldAuthorize(model.songId.value, model.musicianId.value, true);
    testCase.shouldMatch(scopedCriteria, [model]);
    testCase.shouldCount(scopedCriteria, 1);
    await testCase.assertRunResponse(response, model.songId.value, model.musicianId.value, criteria, useCase);

    expect(response.toPrimitives()).toMatchObject({
      items: [
        {
          id: model.id.value,
          upload: null
        }
      ],
      total: 1
    });
  });

  it('returns the active upload status for each listed song instrument', async () => {
    const uploadRepository = mock<SongInstrumentUploadPersistenceRepository>();
    const persistenceRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCaseWithUploads = Reflect.construct(SongInstrumentMatcher, [
      persistenceRepository,
      authorizationRepository,
      uploadRepository
    ]) as SongInstrumentMatcher;
    const processingUpload = SongInstrumentUploadMother.create({
      status: { value: SongInstrumentUploadStatusValues.PROCESSING } as never
    });
    const failedUpload = SongInstrumentUploadMother.create({
      status: { value: SongInstrumentUploadStatusValues.FAILED } as never,
      errorMessage: { value: 'Upload processing failed. Please try again.' } as never
    });
    const processingInstrument = SongInstrumentMother.create({
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(processingUpload.id.value)
    });
    const failedInstrument = SongInstrumentMother.create({
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(failedUpload.id.value)
    });
    const criteria = SongInstrumentMatchByCriteriaCriteriaMother.byId(processingInstrument.id.value);

    authorizationRepository.isBandMember.mockResolvedValue(true);
    persistenceRepository.matching.mockResolvedValue([processingInstrument, failedInstrument]);
    persistenceRepository.matchingCount.mockResolvedValue(2);
    uploadRepository.search.mockResolvedValueOnce(processingUpload).mockResolvedValueOnce(failedUpload);

    const response = await useCaseWithUploads.run(
      processingInstrument.songId.value,
      processingInstrument.musicianId.value,
      criteria
    );

    expect(response.toPrimitives()).toMatchObject({
      items: [
        {
          id: processingInstrument.id.value,
          upload: {
            status: SongInstrumentUploadStatusValues.PROCESSING
          }
        },
        {
          id: failedInstrument.id.value,
          upload: {
            status: SongInstrumentUploadStatusValues.FAILED,
            errorMessage: 'Upload processing failed. Please try again.'
          }
        }
      ],
      total: 2
    });
  });

  it('reject listing for musicians outside the song band', async () => {
    const model = SongInstrumentMother.create();
    const criteria = SongInstrumentMatchByCriteriaCriteriaMother.byId(model.id.value);

    testCase.shouldAuthorize(model.songId.value, model.musicianId.value, false);
    await testCase.assertRunException(
      model.songId.value,
      model.musicianId.value,
      criteria,
      useCase,
      ForbiddenException
    );
  });
});
