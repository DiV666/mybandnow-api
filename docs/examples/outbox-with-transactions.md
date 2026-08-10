# Outbox con transacciones — implementado

> Este documento describía cómo añadir transacciones MongoDB (solo disponibles con replica set) para
> garantizar atomicidad entre el agregado y el Outbox. La plataforma migró a PostgreSQL/Prisma y esa
> atomicidad **ya está implementada** de forma incondicional — Postgres soporta transacciones también
> en local, sin necesidad de replica set ni configuración especial.

Ver la implementación real y la convención a seguir en nuevos repositorios:

- [`docs/architecture/outbox-pattern.md`](../architecture/outbox-pattern.md) — sección "Convención al añadir un nuevo repositorio con outbox"
- [`docs/examples/user-registration-with-transactions.md`](./user-registration-with-transactions.md) — ejemplo completo con `UserPrismaRepository`

Ejemplo mínimo del patrón real (`client.$transaction`, no `session.withTransaction`):

```typescript
async save(entity: MyAggregate): Promise<void> {
  const data = entity.toPrimitives();
  const events = entity.pullDomainEvents({ drain: false }); // peek, no vacía

  await this.client.$transaction(async (tx) => {
    await tx.myTable.upsert({ where: { id: data.id }, update: data, create: data });

    if (events.length > 0) {
      await this.outbox.save(events, tx as unknown as TransactionSession);
    }
  });
}
```
