import { Instruments } from '@Contexts/Instruments/domain/Instruments.js';
import { InstrumentsIdMother } from './InstrumentsIdMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';
import { InstrumentsCreatedAtMother } from './InstrumentsCreatedAtMother.js';
import { InstrumentsNameMother } from './InstrumentsNameMother.js';
import { InstrumentsDescriptionMother } from './InstrumentsDescriptionMother.js';

export class InstrumentsMother {
  private static defaults(): Partial<Instruments> {
    return {
      id: InstrumentsIdMother.random(),
      description: InstrumentsDescriptionMother.random(),
      name: InstrumentsNameMother.random(),
      createdAt: InstrumentsCreatedAtMother.now()
    };
  }

  static create(...params: Partial<Instruments>[]): Instruments {
    const data = Object.assign({}, InstrumentsMother.defaults(), ...params) as Required<Instruments>;

    return Instruments.fromPrimitives({
      id: data.id.value,
      description: data.description.value,
      name: data.name.value,
      createdAt: data.createdAt.value
    });
  }

  static random(): Instruments {
    return InstrumentsMother.create(InstrumentsMother.defaults());
  }

  static createList(): Array<Instruments> {
    return Repeater.random(InstrumentsMother.create);
  }
}
