import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { Band } from '../../domain/Band.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { BandId } from '../../domain/value-object/BandId.js';
import { BandExistException } from '../../domain/exception/BandExistException.js';
import { QueryBus } from '@Contexts/Shared/domain/QueryBus.js';
import { MusicianSearchByUserIdQuery } from '../../../Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { MusicianId } from '../../../Musician/domain/value-object/MusicianId.js';
import { BandOwnerId } from '../../domain/value-object/BandOwnerId.js';
import { BandMember } from '../../domain/BandMember.js';
import { BandMemberId } from '../../domain/value-object/BandMemberId.js';
import { BandMemberRole } from '../../domain/value-object/BandMemberRole.js';

export class BandCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: BandPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
    private readonly queryBus: QueryBus
  ) {}

  async run(command: { id: string; name: string; ownerId: string }): Promise<void> {
    const { id, name, ownerId: userId } = command;
    const query = new MusicianSearchByUserIdQuery(userId);
    const response = await this.queryBus.ask<MusicianSearchByUserIdResponse>(query);

    if (!response.musician) {
      throw new InvalidArgumentException({ message: `Musician for userId ${userId} not found` });
    }

    const musicianId = new MusicianId(response.musician.id);
    const ownerId = new BandOwnerId(musicianId.value);

    const bandFounded = await this.persistenceRepository.search(new BandId(id));

    if (bandFounded) {
      const currentPrimitives = bandFounded.toPrimitives();
      const inputParams: Partial<Omit<Primitives<Band>, 'createdAt'>> = { id, name, ownerId: ownerId.value };

      const hasConflicts = Object.keys(inputParams).some((key) => {
        const typedKey = key as keyof Omit<Primitives<Band>, 'createdAt'>;
        return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(inputParams[typedKey]);
      });

      if (!hasConflicts) {
        return;
      }

      throw new BandExistException(id);
    }

    // Automatically add the creator as ADMIN member
    const member = new BandMember(new BandMemberId(BandMemberId.random()), musicianId, new BandMemberRole('ADMIN'));

    const band = Band.create({ id, name, ownerId: ownerId.value, members: [member.toPrimitives()] }, this.clock);

    await this.persistenceRepository.save(band);
    await this.eventBus.publish(band.pullDomainEvents());

    this.logger.info({ id }, 'moat.band.create.success');
  }
}
