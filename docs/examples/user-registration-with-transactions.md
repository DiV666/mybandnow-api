# Ejemplo: registro de usuario con outbox transaccional (Prisma)

Este ejemplo muestra cómo se garantiza atomicidad entre la persistencia de un agregado y el guardado
de sus eventos de dominio en el Outbox, usando el patrón real de este proyecto (Prisma `$transaction`,
no sesiones de MongoDB). Es el mismo patrón que siguen `BandPrismaRepository`, `PrismaMusicianRepository`
y `VideoclipPrismaRepository`.

## Flujo

```text
POST /v1/users/register
  -> UserPostRegisterController
  -> CommandBus.dispatch(RegisterUserCommand)
  -> RegisterUserCommandHandler
  -> UserRegister.run()
     -> UserPrismaRepository.save(user)
        -> client.$transaction:
             tx.user.upsert(data)
             outbox.save(events, tx)     // misma transacción
     -> eventBus.publish(user.pullDomainEvents())   // publicación inmediata tras confirmar
```

## Estructura real

```text
src/
├── Contexts/
│   ├── Identity/
│   │   └── User/
│   │       ├── application/register/
│   │       ├── domain/
│   │       └── infrastructure/persistence/
│   └── Shared/
│       └── infrastructure/EventBus/Outbox/
└── apps/mybandnow/backend/
```

## Handler de aplicación

```typescript
// src/Contexts/Identity/User/application/register/UserRegister.ts

export class UserRegister {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: UserPersistenceRepository,
    private readonly passwordEncryptor: PasswordEncryptor,
    private readonly eventBus: EventBus
  ) {}

  async run({ id, email, password }: { id: string; email: string; password: string }): Promise<void> {
    // criteria: filter by email (see UserRegister.ts for the full Criteria construction)
    const [existingUser] = await this.persistenceRepository.matching(criteria);

    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    const hashedPassword = await this.passwordEncryptor.hash(password);
    const user = User.create(new UserId(id), new UserEmail(email), new UserPassword(hashedPassword));

    await this.persistenceRepository.save(user);
    await this.eventBus.publish(user.pullDomainEvents());
  }
}
```

El caso de uso no conoce Prisma ni el Outbox — solo llama a `save()` y publica lo que quede en el
agregado tras guardarlo.

## Repositorio

El repositorio es quien realmente garantiza la atomicidad: guarda el agregado y sus eventos en el
Outbox **dentro de la misma transacción de Prisma**, mirando los eventos sin vaciarlos (`drain: false`)
para que el caso de uso pueda publicarlos después vía `EventBus`.

```typescript
// src/Contexts/Identity/User/infrastructure/persistence/UserPrismaRepository.ts

export class UserPrismaRepository implements UserPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  async save(user: User): Promise<void> {
    const data = user.toPrimitives();

    // Peek at domain events without clearing them so the use case can still publish to EventBus
    const events = user.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.user.upsert({ where: { id: data.id }, update: data, create: data });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }
}
```

## Controlador HTTP

```typescript
// src/apps/mybandnow/backend/controllers/user/UserPostRegisterController.ts

const command = new RegisterUserCommand(id, email, password);
await this.commandBus.dispatch(command);
```

`/v1/users/register` es público por diseño (`security: []` en el OpenAPI) — no hay usuario
autenticado antes de crear la cuenta.

## Registro en DI

```typescript
// src/apps/mybandnow/backend/config/dependency-injection/use-cases/user/userRegister.dependency.ts

container
  .register('Identity.User.UserRegister', UserRegister)
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addArgument(new Reference('Identity.User.UserRepository'))
  .addArgument(new Reference('Identity.User.PasswordEncryptor'))
  .addArgument(new Reference('Shared.EventBus'));

container
  .register('Identity.User.RegisterUserCommandHandler', RegisterUserCommandHandler)
  .addArgument(new Reference('Identity.User.UserRegister'))
  .addTag('commandHandler');
```

`Identity.User.UserRepository` se registra aparte, con el Outbox como dependencia, en
`src/apps/mybandnow/backend/config/dependency-injection/dependencies/mybandnowDependencies.ts`:

```typescript
container.register('Identity.User.UserRepository', UserPrismaRepository).addArgument(new Reference('Shared.Outbox'));
```

## Qué resuelve

Sin transacción:

```typescript
await userRepository.save(user);
await outbox.save(events);
```

Si el proceso cae entre esas dos líneas, el usuario queda persistido pero su evento de dominio se
pierde silenciosamente — nadie más se entera de que se creó. Fue exactamente el bug que se encontró
y arregló en `Musician` y `Videoclip` (ver outbox de este mismo repositorio).

Con transacción (el patrón real de este proyecto):

```typescript
await client.$transaction(async (tx) => {
  await tx.user.upsert(data);
  await outbox.save(events, tx);
});
```

Ambas escrituras se confirman o se revierten juntas: no hay estado intermedio donde el agregado
existe pero su evento no.

## Resumen

- El dominio (`User`) emite eventos, pero no conoce Prisma ni el Outbox.
- La aplicación (`UserRegister`) orquesta: valida, guarda, publica — no abre transacciones.
- La infraestructura (`UserPrismaRepository`) es quien abre la transacción de Prisma y persiste
  agregado + outbox atómicamente.
- `apps/` solo despacha el comando; no coordina persistencia ni conoce el Outbox.
