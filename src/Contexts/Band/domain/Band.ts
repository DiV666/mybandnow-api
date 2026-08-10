import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { BandRemovedDomainEvent } from './BandRemovedDomainEvent.js';
import { BandUpdatedDomainEvent } from './BandUpdatedDomainEvent.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { BandCreatedDomainEvent } from './BandCreatedDomainEvent.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { BandId } from './value-object/BandId.js';
import { BandCreatedAt } from './value-object/BandCreatedAt.js';
import { BandName } from './value-object/BandName.js';
import { BandOwnerId } from './value-object/BandOwnerId.js';
import { BandMember, BandMemberPrimitives } from './BandMember.js';

export class Band extends AggregateRoot {
  constructor(
    readonly id: BandId,
    readonly ownerId: BandOwnerId,
    readonly name: BandName,
    readonly members: BandMember[],
    readonly createdAt: BandCreatedAt
  ) {
    super();
  }

  static create(
    params: { id: string; name: string; ownerId: string; members: BandMemberPrimitives[] },
    clock: Clock
  ): Band {
    const createdAt = clock.now();

    const model = Band.fromPrimitives({
      ...params,
      createdAt: createdAt
    });

    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    model.record(
      new BandCreatedDomainEvent({
        aggregateId: id,
        createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
        ...primitives
      })
    );

    return model;
  }

  update({ ...newValues }: Partial<Primitives<Band>>): Band {
    const currentPrimitives = this.toPrimitives();

    const hasChanges = Object.keys(newValues).some((key) => {
      const typedKey = key as keyof Primitives<Band>;
      return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(newValues[typedKey]);
    });

    if (!hasChanges) {
      return this;
    }

    const model = Band.fromPrimitives(Object.assign(currentPrimitives, newValues));

    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    model.record(
      new BandUpdatedDomainEvent({
        aggregateId: id,
        createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
        ...primitives
      })
    );

    return model;
  }

  remove(): void {
    const { id, createdAt: createdAtRaw, ...primitives } = this.toPrimitives();
    this.record(
      new BandRemovedDomainEvent({
        aggregateId: id,
        createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
        ...primitives
      })
    );
  }

  static fromPrimitives(plainData: Primitives<Band>): Band {
    return new Band(
      new BandId(plainData.id),
      new BandOwnerId(plainData.ownerId),
      new BandName(plainData.name),
      plainData.members.map(BandMember.fromPrimitives),
      new BandCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): Primitives<Band> {
    return {
      id: this.id.value,
      ownerId: this.ownerId.value,
      name: this.name.value,
      members: this.members.map((m) => m.toPrimitives()),
      createdAt: this.createdAt.value
    };
  }
}
