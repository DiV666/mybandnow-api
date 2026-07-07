# Ejemplo: registro de usuario con transacciones MongoDB

Este ejemplo muestra cómo garantizar atomicidad entre la persistencia de un agregado y el guardado de eventos en Outbox.

## Flujo

```text
POST /v1/users/register
  -> UserPostRegisterController
  -> CommandBus.dispatch(RegisterUserCommand)
  -> RegisterUserCommandHandler
  -> session.withTransaction()
     -> UserRepository.save(user, session)
     -> Outbox.save(events, session)
```

## Estructura sugerida

Para un ejemplo nuevo en esta plantilla, usa rutas bajo `Contexts/Mybandnow/...`.

```text
src/
├── Contexts/
│   ├── Mybandnow/
│   │   └── User/
│   │       ├── application/RegisterUser/
│   │       ├── domain/
│   │       └── infrastructure/persistence/
│   └── Shared/
└── apps/mybandnow/backend/
```

## Handler de aplicación

```typescript
// src/Contexts/Mybandnow/User/application/RegisterUser/RegisterUserCommandHandler.ts

import { CommandHandler } from '@Contexts/Shared/domain/CommandBus/CommandHandler.js';
import { Outbox } from '@Contexts/Shared/domain/Outbox.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { ClientSession, MongoClient } from 'mongodb';
import { RegisterUserCommand } from './RegisterUserCommand.js';
import { UserRepository } from '../../domain/UserRepository.js';
import { User } from '../../domain/User.js';

export class RegisterUserCommandHandler implements CommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly outbox: Outbox,
    private readonly mongoClientPromise: Promise<MongoClient>,
    private readonly logger: Logger
  ) {}

  async handle(command: RegisterUserCommand): Promise<void> {
    const user = User.register({
      id: command.id,
      email: command.email,
      name: command.name
    });

    const events = user.pullDomainEvents();
    const mongoClient = await this.mongoClientPromise;
    const session: ClientSession = mongoClient.startSession();

    try {
      await session.withTransaction(async () => {
        await this.userRepository.save(user, session);
        await this.outbox.save(events, session as never);
      });
    } catch (error) {
      this.logger.error({ error, userId: user.id.value }, 'User registration failed');
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
```

## Repositorio

El puerto de dominio sigue siendo agnóstico de infraestructura. La implementación concreta acepta `session` como argumento opcional.

```typescript
// src/Contexts/Mybandnow/User/infrastructure/persistence/UserMongoRepository.ts

import { ClientSession } from 'mongodb';

async save(user: User, session?: ClientSession): Promise<void> {
  await this.persist(user, session);
}
```

## Controlador HTTP

```typescript
// src/apps/mybandnow/backend/controllers/user/UserPostRegisterController.ts

import { RegisterUserCommand } from '@Contexts/Mybandnow/User/application/RegisterUser/RegisterUserCommand.js';

const command = RegisterUserCommand.fromPrimitives({
  id: req.body.id,
  email: req.body.email,
  name: req.body.name
});

await this.commandBus.dispatch(command);
```

## Registro en DI

```typescript
// src/apps/mybandnow/backend/config/dependency-injection/use-cases/user/registerUser.ts

container
  .register('Mybandnow.User.RegisterUserCommandHandler', RegisterUserCommandHandler)
  .addArgument(new Reference('Mybandnow.User.UserRepository'))
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.MongoConnectionManager'))
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addTag('commandHandler', { command: 'RegisterUserCommand' });
```

## Qué resuelve

Sin transacción:

```typescript
await userRepository.save(user);
await outbox.save(events);
```

Si `outbox.save()` falla, el agregado puede quedar persistido sin evento.

Con transacción:

```typescript
await session.withTransaction(async () => {
  await userRepository.save(user, session);
  await outbox.save(events, session as never);
});
```

Ambas escrituras se confirman o se revierten juntas.

## Resumen

- El dominio emite eventos, pero no conoce MongoDB.
- La aplicación orquesta la transacción.
- Infraestructura adapta `session` al repositorio y al Outbox.
- `apps/` solo despacha comandos; no coordina persistencia.
