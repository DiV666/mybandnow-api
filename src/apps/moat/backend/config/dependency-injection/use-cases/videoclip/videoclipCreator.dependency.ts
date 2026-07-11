import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { VideoclipCreator } from '@Contexts/Moat/Videoclip/application/create/VideoclipCreator.js';
import { CreateVideoclipCommandHandler } from '@Contexts/Moat/Videoclip/application/create/CreateVideoclipCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Videoclip.VideoclipCreator', VideoclipCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.Videoclip.VideoclipRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Moat.Videoclip.CreateVideoclipCommandHandler', CreateVideoclipCommandHandler)
    .addArgument(new Reference('Moat.Videoclip.VideoclipCreator'))
    .addTag('commandHandler');
}
