import { describe, it, beforeEach } from 'vitest';
import { BandRemover } from '@Contexts/Band/application/remove/BandRemover.js';
import { BandMother } from '../../domain/BandMother.js';
import { RemoveBandCommandMother } from './RemoveBandCommandMother.js';
import { RemoveBandCommandHandler } from '@Contexts/Band/application/remove/RemoveBandCommandHandler.js';
import { BandRemoverTestCase } from './BandRemoverTestCase.js';
import { BandRemovedDomainEventMother } from '../../domain/BandRemovedDomainEventMother.js';

describe('BandRemover should', () => {
  let testCase: BandRemoverTestCase;
  let commandHandler: RemoveBandCommandHandler;

  beforeEach(() => {
    testCase = new BandRemoverTestCase();
    const useCase = new BandRemover(
      testCase.logger(),
      testCase.scopeSecurity(),
      testCase.persistenceRepository(),
      testCase.eventBus()
    );
    commandHandler = new RemoveBandCommandHandler(useCase);
  });

  it('remove a valid band', async () => {
    const model = BandMother.create();
    const command = RemoveBandCommandMother.fromModel(model);
    const domainEvent = BandRemovedDomainEventMother.fromModel(model);

    testCase.shouldMatching(model);
    testCase.shouldRemove(model);
    testCase.shouldPublishDomainEvent(domainEvent, ['attributes.createdAt']);

    await testCase.dispatch(command, commandHandler);
    testCase.assertRemove(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('return success when the band does not exist (idempotent remove)', async () => {
    const model = BandMother.create();
    const command = RemoveBandCommandMother.fromModel(model);

    testCase.shouldMatching();
    await testCase.dispatch(command, commandHandler);
    testCase.assertNotRemove();
  });
});
