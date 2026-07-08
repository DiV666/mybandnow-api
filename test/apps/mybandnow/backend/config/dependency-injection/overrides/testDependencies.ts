import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InMemorySyncEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/InMemory/InMemorySyncEventBus.js';
import { KeycloakClientFactory } from '../../../../../../../src/Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakClientFactory.js';
import { PrismaEnvironmentArranger } from '../../../../../../utils/arranger/PrismaEnvironmentArranger.js';
import { KeycloakEnvironmentArranger } from '../../../../../../utils/arranger/KeycloakEnvironmentArranger.js';
import { TestKeycloakConfigFactory } from '../../../../../../utils/keycloak/TestKeycloak.js';
import { env } from '../../../../../../../src/Contexts/Shared/infrastructure/config/env.js';

export function registerTestDependencies(container: ContainerBuilder): void {
  container.register('Shared.PrismaEnvironmentArranger', PrismaEnvironmentArranger);

  container
    .register('Shared.KeycloakConnectionManager')
    .addArgument('mybandnow')
    .addArgument({
      origin: env.KEYCLOAK_ORIGIN,
      realm: 'master'
    })
    .setFactory(KeycloakClientFactory, 'createClient');

  container.register('Apps.Mybandnow.Backend.KeyCloakConfig').setFactory(TestKeycloakConfigFactory, 'createConfig');

  container
    .register('Shared.KeycloakEnvironmentArranger', KeycloakEnvironmentArranger)
    .addArgument(new Reference('Shared.KeycloakConnectionManager'))
    .addArgument(new Reference('Apps.Mybandnow.Backend.KeyCloakConfig'));

  container.register('Shared.EventBus', InMemorySyncEventBus);
}
