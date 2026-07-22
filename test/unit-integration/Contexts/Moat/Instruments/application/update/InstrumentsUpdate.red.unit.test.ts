import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { InstrumentsUpdater } from '@Contexts/Moat/Instruments/application/update/InstrumentsUpdater.js';
import { UpdateInstrumentsCommand } from '@Contexts/Moat/Instruments/application/update/UpdateInstrumentsCommand.js';
import type { InstrumentsPersistenceRepository } from '@Contexts/Moat/Instruments/domain/repository/InstrumentsPersistenceRepository.js';
import type { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { InstrumentsMother } from '../../domain/InstrumentsMother.js';

describe('InstrumentsUpdater (RED)', () => {
  it('updates name and description for an existing instrument', async () => {
    const repository = mock<InstrumentsPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const instrument = InstrumentsMother.create();
    const command = new UpdateInstrumentsCommand(
      instrument.id.value,
      `${instrument.name.value} updated`,
      `${instrument.description.value} updated`
    );

    repository.search.mockResolvedValueOnce(instrument);

    const updater = new InstrumentsUpdater(repository, eventBus);

    await updater.run(command);

    expect(repository.save).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });
});
