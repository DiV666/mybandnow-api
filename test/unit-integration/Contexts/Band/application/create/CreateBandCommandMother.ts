import { BandIdMother } from '../../domain/BandIdMother.js';
import { CreateBandCommand } from '@Contexts/Band/application/create/CreateBandCommand.js';
import { Band } from '@Contexts/Band/domain/Band.js';
import { BandNameMother } from '../../domain/BandNameMother.js';
import { BandOwnerIdMother } from '../../domain/BandOwnerIdMother.js';

export class CreateBandCommandMother {
  private static defaults() {
    return {
      id: BandIdMother.random().value,
      ownerId: BandOwnerIdMother.random().value,
      name: BandNameMother.random().value
    };
  }

  static create(params?: Partial<ReturnType<typeof CreateBandCommandMother.defaults>>): CreateBandCommand {
    const commandData = { ...this.defaults(), ...params };
    return new CreateBandCommand(commandData.id, commandData.ownerId, commandData.name);
  }

  static fromModel(model: Band): CreateBandCommand {
    const p = model.toPrimitives();
    return this.create({ id: p.id, name: p.name, ownerId: p.ownerId });
  }
}
