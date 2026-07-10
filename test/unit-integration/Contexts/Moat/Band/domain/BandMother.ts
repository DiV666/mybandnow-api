import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { BandIdMother } from './BandIdMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';
import { BandCreatedAtMother } from './BandCreatedAtMother.js';
import { BandNameMother } from './BandNameMother.js';
import { BandOwnerIdMother } from './BandOwnerIdMother.js';

export class BandMother {
  private static defaults(): Partial<Band> {
    return {
      id: BandIdMother.random(),
      ownerId: BandOwnerIdMother.random(),
      name: BandNameMother.random(),
      members: [],
      createdAt: BandCreatedAtMother.now()
    };
  }

  static create(...params: Partial<Band>[]): Band {
    const data = Object.assign({}, BandMother.defaults(), ...params) as Required<Band>;

    return Band.fromPrimitives({
      id: data.id.value,
      ownerId: data.ownerId.value,
      name: data.name.value,
      members: data.members.map((m) => m.toPrimitives()),
      createdAt: data.createdAt.value
    });
  }

  static random(): Band {
    return BandMother.create(BandMother.defaults());
  }

  static createList(): Array<Band> {
    return Repeater.random(BandMother.create);
  }
}
