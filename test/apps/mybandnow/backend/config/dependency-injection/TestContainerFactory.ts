import { ContainerBuilder } from 'node-dependency-injection';
import { createContainer } from '../../../../../../src/apps/mybandnow/backend/config/dependency-injection/index.js';
import { registerTestDependencies } from './overrides/testDependencies.js';

export class TestContainerFactory {
  static create(): ContainerBuilder {
    const container = createContainer();
    registerTestDependencies(container);

    return container;
  }
}
