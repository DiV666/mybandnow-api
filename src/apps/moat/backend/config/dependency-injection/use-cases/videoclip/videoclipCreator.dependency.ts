import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { VideoclipCreator } from '@Contexts/Videoclip/application/create/VideoclipCreator.js';
import { CreateVideoclipCommandHandler } from '@Contexts/Videoclip/application/create/CreateVideoclipCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Videoclip.VideoclipCreator', VideoclipCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Videoclip.VideoclipRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Videoclip.CreateVideoclipCommandHandler', CreateVideoclipCommandHandler)
    .addArgument(new Reference('Videoclip.VideoclipCreator'))
    .addTag('commandHandler');
}
