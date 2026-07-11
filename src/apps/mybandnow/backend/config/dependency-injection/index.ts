import { ContainerBuilder } from 'node-dependency-injection';
import { registerAppsDependencies } from './dependencies/appsDependencies.js';
import { registerMybandnowDependencies } from './dependencies/mybandnowDependencies.js';
import { registerSharedDependencies } from './dependencies/sharedDependencies.js';
import { registerOrchestratorDependencies } from './dependencies/orchestratorDependencies.js';

export function createContainer(): ContainerBuilder {
  const container = new ContainerBuilder();

  registerSharedDependencies(container);
  registerMybandnowDependencies(container);
  registerAppsDependencies(container);
  registerOrchestratorDependencies(container);

  return container;
}

const container = createContainer();

export default container;
