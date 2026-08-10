import { describe, it, beforeEach } from 'vitest';
import { BandCreator } from '@Contexts/Band/application/create/BandCreator.js';
import { BandMother } from '../../domain/BandMother.js';
import { CreateBandCommandMother } from './CreateBandCommandMother.js';
import { CreateBandCommandHandler } from '@Contexts/Band/application/create/CreateBandCommandHandler.js';
import { BandCreatorTestCase } from './BandCreatorTestCase.js';
import { BandCreatedDomainEventMother } from '../../domain/BandCreatedDomainEventMother.js';
import { BandExistException } from '@Contexts/Band/domain/exception/BandExistException.js';
import { BandId } from '@Contexts/Band/domain/value-object/BandId.js';

describe('BandCreator should', () => {
  let testCase: BandCreatorTestCase;
  let commandHandler: CreateBandCommandHandler;

  beforeEach(() => {
    testCase = new BandCreatorTestCase();
    const useCase = new BandCreator(
      testCase.logger(),
      testCase.persistenceRepository(),
      testCase.eventBus(),
      testCase.clock()
    );
    commandHandler = new CreateBandCommandHandler(useCase);
  });

  it('create a valid band', async () => {
    const band = BandMother.create();
    const command = CreateBandCommandMother.fromModel(band);
    const domainEvent = BandCreatedDomainEventMother.fromModel(band);

    testCase.shouldSearch(band.id); // Ensure it doesn't exist
    testCase.shouldSave(band);
    testCase.shouldPublishDomainEvent(domainEvent, [
      'attributes.createdAt',
      'attributes.updatedAt',
      'attributes.members'
    ]);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('return success when the band already exists with the same properties (idempotency)', async () => {
    const band = BandMother.create();
    const command = CreateBandCommandMother.fromModel(band);

    testCase.shouldSearch(band.id, band); // Mock that it exists
    await testCase.dispatch(command, commandHandler);
    testCase.assertNotSave();
  });

  it('throw an exception when the band already exists with different properties', async () => {
    const band = BandMother.create();
    const command = CreateBandCommandMother.create(); // Completely different random command

    testCase.shouldSearch(new BandId(command.id), band); // Mock that search by command ID returns a different model
    await testCase.assertSaveException(command, commandHandler, BandExistException);
  });
});
