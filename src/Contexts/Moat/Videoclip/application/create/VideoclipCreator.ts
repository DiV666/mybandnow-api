import { EventBus } from '../../../../Shared/domain/EventBus.js';
import { Videoclip, VideoclipPrimitives } from '../../domain/Videoclip.js';
import { VideoclipPersistenceRepository } from '../../domain/repository/VideoclipPersistenceRepository.js';
import Logger from '../../../../Shared/domain/Logger.js';
import { VideoclipId } from '../../domain/value-object/VideoclipId.js';
import { VideoclipExistException } from '../../domain/exception/VideoclipExistException.js';

export class VideoclipCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: VideoclipPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run({ id, size, duration, url, isPublic, songId }: Omit<VideoclipPrimitives, 'createdAt'>): Promise<void> {
    const videoclipFounded = await this.persistenceRepository.search(new VideoclipId(id));
    if (videoclipFounded) {
      throw new VideoclipExistException(id);
    }

    const videoclip = Videoclip.create({ id, size, duration, url, isPublic, songId });
    this.logger.info(videoclip.toPrimitives(), 'VideoclipCreator.model:');

    await this.persistenceRepository.save(videoclip);
    await this.eventBus.publish(videoclip.pullDomainEvents());
    this.logger.info(`The videoclip <${id}> has been created`, 'VideoclipCreator:');
  }
}
