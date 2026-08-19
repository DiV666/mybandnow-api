import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentMusicianId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentBandMemberReassigner } from '@Contexts/SongInstrument/SongInstrument/application/reassignBandMember/SongInstrumentBandMemberReassigner.js';
import { ReassignBandMemberSongInstrumentsCommand } from '@Contexts/SongInstrument/SongInstrument/application/reassignBandMember/ReassignBandMemberSongInstrumentsCommand.js';

const bandId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const previousMusicianId = '11111111-1111-4111-8111-111111111111';
const newMusicianId = '22222222-2222-4222-8222-222222222222';

describe('SongInstrumentBandMemberReassigner', () => {
  it('reassigns the removed musician song instruments within the band to the new musician', async () => {
    const logger = mock<Logger>();
    const repository = mock<SongInstrumentPersistenceRepository>();
    const useCase = new SongInstrumentBandMemberReassigner(logger, repository);
    const command = new ReassignBandMemberSongInstrumentsCommand(bandId, previousMusicianId, newMusicianId);

    repository.reassignBandMemberInstruments.mockResolvedValue(2);

    await useCase.run(command);

    expect(repository.reassignBandMemberInstruments).toHaveBeenCalledWith(
      bandId,
      new SongInstrumentMusicianId(previousMusicianId),
      new SongInstrumentMusicianId(newMusicianId)
    );
  });

  it('does not log when there is nothing to reassign', async () => {
    const logger = mock<Logger>();
    const repository = mock<SongInstrumentPersistenceRepository>();
    const useCase = new SongInstrumentBandMemberReassigner(logger, repository);
    const command = new ReassignBandMemberSongInstrumentsCommand(bandId, previousMusicianId, newMusicianId);

    repository.reassignBandMemberInstruments.mockResolvedValue(0);

    await useCase.run(command);

    expect(logger.info).not.toHaveBeenCalled();
  });
});
