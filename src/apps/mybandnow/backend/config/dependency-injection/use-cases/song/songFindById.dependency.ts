import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongFindById } from '@Contexts/Song/application/findById/SongFindById.js';
import { SongFindByIdQueryHandler } from '@Contexts/Song/application/findById/SongFindByIdQueryHandler.js';

export function register(container: ContainerBuilder) {
  container.register('Song.SongFindById', SongFindById).addArgument(new Reference('Song.SongRepository'));

  container
    .register('Song.SongFindByIdQueryHandler', SongFindByIdQueryHandler)
    .addArgument(new Reference('Song.SongFindById'))
    .addTag('queryHandler');
}
