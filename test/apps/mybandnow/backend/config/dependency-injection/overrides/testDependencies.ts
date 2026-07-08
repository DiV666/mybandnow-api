import { ContainerBuilder } from 'node-dependency-injection';
import { InMemorySyncEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/InMemory/InMemorySyncEventBus.js';
import { PrismaEnvironmentArranger } from '../../../../../../utils/arranger/PrismaEnvironmentArranger.js';

export function registerTestDependencies(container: ContainerBuilder): void {
  container.register('Shared.PrismaEnvironmentArranger', PrismaEnvironmentArranger);

  container.register('Shared.EventBus', InMemorySyncEventBus);
}
