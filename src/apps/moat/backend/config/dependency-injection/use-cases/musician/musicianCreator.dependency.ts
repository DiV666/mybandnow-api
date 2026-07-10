import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { MusicianCreator } from '@Contexts/Moat/Musician/application/create/MusicianCreator.js';
import { CreateMusicianCommandHandler } from '@Contexts/Moat/Musician/application/create/CreateMusicianCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Musician.MusicianCreator', MusicianCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.Musician.MusicianRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Moat.Musician.CreateMusicianCommandHandler', CreateMusicianCommandHandler)
    .addArgument(new Reference('Moat.Musician.MusicianCreator'))
    .addTag('commandHandler');
}
