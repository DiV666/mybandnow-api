import Logger from '@Contexts/Shared/domain/Logger.js';
import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { AddBandMemberCommand } from './AddBandMemberCommand.js';
import { BandId } from '../../domain/value-object/BandId.js';
import { BandNotExistException } from '../../domain/exception/BandNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { BandMemberId } from '../../domain/value-object/BandMemberId.js';
import { BandMemberRoleValues } from '../../domain/value-object/BandMemberRole.js';

export class BandMemberAdder {
  constructor(
    private readonly logger: Logger,
    private readonly repository: BandPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: AddBandMemberCommand): Promise<void> {
    const band = await this.repository.search(new BandId(command.bandId));

    if (!band) {
      throw new BandNotExistException(command.bandId);
    }

    if (band.ownerId.value !== command.authenticatedMusicianId) {
      throw new ForbiddenException('Only the band owner can add members.');
    }

    const alreadyLinked =
      band.ownerId.value === command.musicianId ||
      band.members.some((member) => member.musicianId.value === command.musicianId);

    if (alreadyLinked) {
      return;
    }

    const updatedBand = band.update({
      members: [
        ...band.members.map((member) => member.toPrimitives()),
        {
          id: BandMemberId.random(),
          musicianId: command.musicianId,
          role: BandMemberRoleValues.MEMBER
        }
      ]
    });
    const domainEvents = updatedBand.pullDomainEvents();

    if (domainEvents.length === 0) {
      return;
    }

    await this.repository.save(updatedBand);
    await this.eventBus.publish(domainEvents);
    this.logger.info({ bandId: command.bandId, musicianId: command.musicianId }, 'moat.band.member.add.success');
  }
}
