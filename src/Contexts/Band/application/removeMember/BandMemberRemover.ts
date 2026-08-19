import Logger from '@Contexts/Shared/domain/Logger.js';
import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { SongInstrumentReassignmentGateway } from '../../domain/SongInstrumentReassignmentGateway.js';
import { RemoveBandMemberCommand } from './RemoveBandMemberCommand.js';
import { BandId } from '../../domain/value-object/BandId.js';
import { BandNotExistException } from '../../domain/exception/BandNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export class BandMemberRemover {
  constructor(
    private readonly logger: Logger,
    private readonly repository: BandPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly songInstrumentReassignmentGateway: SongInstrumentReassignmentGateway
  ) {}

  async run(command: RemoveBandMemberCommand): Promise<void> {
    const band = await this.repository.search(new BandId(command.bandId));

    if (!band) {
      throw new BandNotExistException(command.bandId);
    }

    if (band.ownerId.value !== command.authenticatedMusicianId) {
      throw new ForbiddenException('Only the band owner can remove members.');
    }

    if (band.ownerId.value === command.musicianId) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: 'The band owner cannot be removed from the band.'
      });
    }

    const isMember = band.members.some((member) => member.musicianId.value === command.musicianId);

    if (!isMember) {
      return;
    }

    const updatedBand = band.update({
      members: band.members
        .filter((member) => member.musicianId.value !== command.musicianId)
        .map((member) => member.toPrimitives())
    });
    const domainEvents = updatedBand.pullDomainEvents();

    if (domainEvents.length === 0) {
      return;
    }

    await this.repository.save(updatedBand);
    await this.eventBus.publish(domainEvents);
    await this.songInstrumentReassignmentGateway.reassignBandMemberInstruments(
      command.bandId,
      command.musicianId,
      band.ownerId.value
    );
    this.logger.info({ bandId: command.bandId, musicianId: command.musicianId }, 'moat.band.member.remove.success');
  }
}
