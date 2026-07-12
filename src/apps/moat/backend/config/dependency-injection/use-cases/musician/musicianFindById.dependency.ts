import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { MusicianFindById } from '@Contexts/Moat/Musician/application/findById/MusicianFindById.js';
import { MusicianFindByIdQueryHandler } from '@Contexts/Moat/Musician/application/findById/MusicianFindByIdQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Musician.MusicianFindById', MusicianFindById)
    .addArgument(new Reference('Moat.Musician.MusicianRepository'));

  container
    .register('Moat.Musician.MusicianFindByIdQueryHandler', MusicianFindByIdQueryHandler)
    .addArgument(new Reference('Moat.Musician.MusicianFindById'))
    .addTag('queryHandler');
}
