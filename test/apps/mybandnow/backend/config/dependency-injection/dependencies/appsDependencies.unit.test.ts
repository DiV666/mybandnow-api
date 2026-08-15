import { describe, expect, it } from 'vitest';
import { ContainerBuilder } from 'node-dependency-injection';
import { registerAppsDependencies } from '../../../../../../../src/apps/mybandnow/backend/config/dependency-injection/dependencies/appsDependencies.js';

describe('registerAppsDependencies', () => {
  it('does not register an auto-create musician subscriber on user registration', () => {
    // Arrange
    const container = new ContainerBuilder();

    // Act
    registerAppsDependencies(container);
    const subscriberIds = Array.from(container.findTaggedServiceIds('domainEventSubscriber')).map(({ id }) => id);

    // Assert
    expect(subscriberIds).not.toContain('Apps.Mybandnow.Backend.subscribers.CreateMusicianOnUserRegistered');
    expect(subscriberIds).toContain('Apps.Mybandnow.Backend.subscribers.ValidateSongInstrumentUploadOnUploadRequested');
    expect(subscriberIds).toContain(
      'Apps.Mybandnow.Backend.subscribers.CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted'
    );
    expect(subscriberIds).toContain(
      'Apps.Mybandnow.Backend.subscribers.FailSongInstrumentUploadOnSongInstrumentProcessFailed'
    );
    expect(subscriberIds).toContain(
      'Apps.Mybandnow.Backend.subscribers.CreateSongInstrumentVideoOnSongInstrumentUploadCompleted'
    );
    expect(subscriberIds).toContain(
      'Apps.Mybandnow.Backend.subscribers.CompleteVideoclipOnVideoclipGenerationCompleted'
    );
    expect(subscriberIds).toContain('Apps.Mybandnow.Backend.subscribers.FailVideoclipOnVideoclipGenerationFailed');
  });

  it('injects a lazy command bus resolver into the song instrument upload subscriber', () => {
    // Arrange
    const container = new ContainerBuilder();

    // Act
    registerAppsDependencies(container);
    const definition = container.getDefinition(
      'Apps.Mybandnow.Backend.subscribers.ValidateSongInstrumentUploadOnUploadRequested'
    );

    // Assert
    expect(definition.args).toHaveLength(4);
    expect(definition.args[2]).toEqual(expect.any(Function));
  });

  it('injects lazy command bus resolvers into the completion subscribers', () => {
    // Arrange
    const container = new ContainerBuilder();

    // Act
    registerAppsDependencies(container);
    const technicalDefinition = container.getDefinition(
      'Apps.Mybandnow.Backend.subscribers.CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted'
    );
    const failedDefinition = container.getDefinition(
      'Apps.Mybandnow.Backend.subscribers.FailSongInstrumentUploadOnSongInstrumentProcessFailed'
    );
    const businessDefinition = container.getDefinition(
      'Apps.Mybandnow.Backend.subscribers.CreateSongInstrumentVideoOnSongInstrumentUploadCompleted'
    );

    // Assert
    expect(technicalDefinition.args).toHaveLength(3);
    expect(technicalDefinition.args[2]).toEqual(expect.any(Function));
    expect(failedDefinition.args).toHaveLength(3);
    expect(failedDefinition.args[2]).toEqual(expect.any(Function));
    expect(businessDefinition.args).toHaveLength(3);
    expect(businessDefinition.args[2]).toEqual(expect.any(Function));
  });
});
