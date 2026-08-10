import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { MusicianCreator } from '@Contexts/Musician/application/create/MusicianCreator.js';
import { CreateMusicianCommandHandler } from '@Contexts/Musician/application/create/CreateMusicianCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Musician.MusicianCreator', MusicianCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Musician.MusicianRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Musician.CreateMusicianCommandHandler', CreateMusicianCommandHandler)
    .addArgument(new Reference('Musician.MusicianCreator'))
    .addTag('commandHandler');
}
