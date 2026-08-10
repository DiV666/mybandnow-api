import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { MusicianFindById } from '@Contexts/Musician/application/findById/MusicianFindById.js';
import { MusicianFindByIdQueryHandler } from '@Contexts/Musician/application/findById/MusicianFindByIdQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Musician.MusicianFindById', MusicianFindById)
    .addArgument(new Reference('Musician.MusicianRepository'));

  container
    .register('Musician.MusicianFindByIdQueryHandler', MusicianFindByIdQueryHandler)
    .addArgument(new Reference('Musician.MusicianFindById'))
    .addTag('queryHandler');
}
