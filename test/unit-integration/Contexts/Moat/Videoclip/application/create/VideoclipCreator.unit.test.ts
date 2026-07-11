import { describe, it, beforeEach } from 'vitest';
import { VideoclipCreator } from '../../../../../../../src/Contexts/Moat/Videoclip/application/create/VideoclipCreator.js';
import { VideoclipMother } from '../../domain/VideoclipMother.js';
import { CreateVideoclipCommandMother } from './CreateVideoclipCommandMother.js';
import { CreateVideoclipCommandHandler } from '../../../../../../../src/Contexts/Moat/Videoclip/application/create/CreateVideoclipCommandHandler.js';
import { VideoclipCreatorTestCase } from './VideoclipCreatorTestCase.js';
import { VideoclipCreatedDomainEventMother } from '../../domain/VideoclipCreatedDomainEventMother.js';
import { VideoclipExistException } from '../../../../../../../src/Contexts/Moat/Videoclip/domain/exception/VideoclipExistException.js';

describe('VideoclipCreator should', () => {
  let testCase: VideoclipCreatorTestCase;
  let commandHandler: CreateVideoclipCommandHandler;

  beforeEach(() => {
    testCase = new VideoclipCreatorTestCase();
    const useCase = new VideoclipCreator(testCase.logger(), testCase.persistenceRepository(), testCase.eventBus());
    commandHandler = new CreateVideoclipCommandHandler(useCase);
  });

  it('create a valid videoclip', async () => {
    const videoclip = VideoclipMother.create();
    const command = CreateVideoclipCommandMother.fromModel(videoclip);
    const domainEvent = VideoclipCreatedDomainEventMother.fromModel(videoclip);

    testCase.shouldSearch(videoclip.id); // Ensure it doesn't exist
    testCase.shouldSave(videoclip);
    testCase.shouldPublishDomainEvent(domainEvent, ['attributes.createdAt', 'attributes.updatedAt']);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('throw an exception when the videoclip already exist', async () => {
    const videoclip = VideoclipMother.create();
    const command = CreateVideoclipCommandMother.fromModel(videoclip);

    testCase.shouldSearch(videoclip.id, videoclip); // Mock that it exists
    await testCase.assertSaveException(command, commandHandler, VideoclipExistException);
  });
});
