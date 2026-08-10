import { UpdateInstrumentsCommand } from '@Contexts/Instruments/application/update/UpdateInstrumentsCommand.js';
import { Instruments } from '@Contexts/Instruments/domain/Instruments.js';
import { InstrumentsDescriptionMother } from '../../domain/InstrumentsDescriptionMother.js';
import { InstrumentsIdMother } from '../../domain/InstrumentsIdMother.js';
import { InstrumentsNameMother } from '../../domain/InstrumentsNameMother.js';

export class UpdateInstrumentsCommandMother {
  static create(params?: { id?: string; description?: string; name?: string }): UpdateInstrumentsCommand {
    const defaults = {
      id: InstrumentsIdMother.random().value,
      description: InstrumentsDescriptionMother.random().value,
      name: InstrumentsNameMother.random().value
    };
    const commandData = { ...defaults, ...params };

    return new UpdateInstrumentsCommand(commandData.id, commandData.name, commandData.description);
  }

  static fromModel(model: Instruments): UpdateInstrumentsCommand {
    return UpdateInstrumentsCommandMother.create({
      id: model.id.value,
      description: model.description.value,
      name: model.name.value
    });
  }
}
