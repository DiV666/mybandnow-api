import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { InstrumentsId } from './value-object/InstrumentsId.js';
import { InstrumentsCreatedAt } from './value-object/InstrumentsCreatedAt.js';
import { InstrumentsName } from './value-object/InstrumentsName.js';
import { InstrumentsDescription } from './value-object/InstrumentsDescription.js';

export class Instruments extends AggregateRoot {
  constructor(
    readonly id: InstrumentsId,
    readonly description: InstrumentsDescription,
    readonly name: InstrumentsName,
    readonly createdAt: InstrumentsCreatedAt
  ) {
    super();
  }

  static fromPrimitives(plainData: Primitives<Instruments>): Instruments {
    return new Instruments(
      new InstrumentsId(plainData.id),
      new InstrumentsDescription(plainData.description),
      new InstrumentsName(plainData.name),
      new InstrumentsCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): Primitives<Instruments> {
    return {
      id: this.id.value,
      description: this.description.value,
      name: this.name.value,
      createdAt: this.createdAt.value
    };
  }
}
