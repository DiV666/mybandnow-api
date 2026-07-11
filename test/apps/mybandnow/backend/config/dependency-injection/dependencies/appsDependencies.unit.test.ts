import { describe, expect, it } from 'vitest';
import { ContainerBuilder, Reference } from 'node-dependency-injection';
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
    expect(subscriberIds).toContain('Apps.Mybandnow.Backend.subscribers.ValidateTrackOnUploadRequested');
  });

  it('injects the command bus into the track upload subscriber', () => {
    // Arrange
    const container = new ContainerBuilder();

    // Act
    registerAppsDependencies(container);
    const definition = container.getDefinition('Apps.Mybandnow.Backend.subscribers.ValidateTrackOnUploadRequested');

    // Assert
    expect(definition.args).toHaveLength(3);
    expect(definition.args[2]).toBeInstanceOf(Reference);
    expect((definition.args[2] as Reference).id).toBe('Shared.CommandBus');
  });
});
