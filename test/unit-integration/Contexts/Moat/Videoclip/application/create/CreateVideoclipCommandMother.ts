import { VideoclipIdMother } from '../../domain/VideoclipIdMother.js';
import { CreateVideoclipCommand } from '../../../../../../../src/Contexts/Moat/Videoclip/application/create/CreateVideoclipCommand.js';
import { Videoclip, VideoclipPrimitives } from '../../../../../../../src/Contexts/Moat/Videoclip/domain/Videoclip.js';
import { VideoclipSizeMother } from '../../domain/VideoclipSizeMother.js';
import { VideoclipDurationMother } from '../../domain/VideoclipDurationMother.js';
import { VideoclipUrlMother } from '../../domain/VideoclipUrlMother.js';
import { VideoclipIsPublicMother } from '../../domain/VideoclipIsPublicMother.js';
import { VideoclipSongIdMother } from '../../domain/VideoclipSongIdMother.js';

type CreateVideoclipCommandPrimitives = Omit<VideoclipPrimitives, 'createdAt'>;

export class CreateVideoclipCommandMother {
  private static defaults(): CreateVideoclipCommandPrimitives {
    return {
      id: VideoclipIdMother.random().value,
      size: VideoclipSizeMother.random().value,
      duration: VideoclipDurationMother.random().value,
      url: VideoclipUrlMother.random().value,
      isPublic: VideoclipIsPublicMother.random().value,
      songId: VideoclipSongIdMother.random().value
    };
  }

  static create(params?: Partial<CreateVideoclipCommand>): CreateVideoclipCommand {
    const commandData = { ...this.defaults(), ...params };
    return new CreateVideoclipCommand(
      commandData.id,
      commandData.size,
      commandData.duration,
      commandData.url,
      commandData.isPublic,
      commandData.songId
    );
  }

  static fromModel(model: Videoclip): CreateVideoclipCommand {
    return this.create(model.toPrimitives());
  }
}
