# TypeScript Path Aliases

## Configuración

El proyecto está configurado con path aliases para eliminar los imports relativos largos (`../../../../../../`).

### Aliases disponibles

| Alias       | Ruta física                | Uso                                              |
| ----------- | -------------------------- | ------------------------------------------------ |
| `@Contexts` | `src/Contexts`             | Importar desde la capa de dominio o shared       |
| `@Apps`     | `src/apps`                 | Importar desde la capa de aplicación (apps)      |
| `@Test`     | `test`                     | Importar utilidades de test (solo en tests)      |

## Ejemplos de migración

### ANTES (con rutas relativas)

```typescript
// En src/apps/mybandnow/backend/config/dependency-injection/dependencies/sharedDependencies.ts
import { CommandHandlersInformation } from '../../../../../../Contexts/Shared/infrastructure/CommandBus/CommandHandlersInformation.js';
import { InMemoryCommandBus } from '../../../../../../Contexts/Shared/infrastructure/CommandBus/InMemoryCommandBus.js';
import { MongoClientFactory } from '../../../../../../Contexts/Shared/infrastructure/persistence/mongo/MongoClientFactory.js';
import { env } from '../../../../../../Contexts/Shared/infrastructure/config/env.js';
```

### DESPUÉS (con path aliases)

```typescript
// En src/apps/mybandnow/backend/config/dependency-injection/dependencies/sharedDependencies.ts
import { CommandHandlersInformation } from '@Contexts/Shared/infrastructure/CommandBus/CommandHandlersInformation.js';
import { InMemoryCommandBus } from '@Contexts/Shared/infrastructure/CommandBus/InMemoryCommandBus.js';
import { MongoClientFactory } from '@Contexts/Shared/infrastructure/persistence/mongo/MongoClientFactory.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
```

### Importar desde Apps

```typescript
// ANTES
import ContinuationLocalStorageExpress from '../../../middlewares/ContinuationLocalStorageExpress.js';

// DESPUÉS
import ContinuationLocalStorageExpress from '@Apps/mybandnow/backend/middlewares/ContinuationLocalStorageExpress.js';
```

### En tests

```typescript
// ANTES
import { SmsTestCase } from '../../../test/unit/Contexts/Communicator/Sms/SmsTestCase.js';

// DESPUÉS
import { SmsTestCase } from '@Test/unit/Contexts/Communicator/Sms/SmsTestCase.js';
```

## Reglas de uso

1. **SIEMPRE** usar path aliases para imports desde `Contexts/` o `apps/` cuando el import requiera 3 o más niveles de `../`.
2. **MANTENER** imports relativos simples cuando estás en el mismo módulo (1-2 niveles).
3. **NUNCA** mezclar aliases con relativos en la misma línea.
4. **RECORDAR** la extensión `.js` al final (requerido por ESM).

## Ejemplos correctos de cuándo NO usar aliases

```typescript
// Mismo directorio o un nivel arriba
import { SmsId } from './SmsId.js';
import { SmsMother } from '../domain/SmsMother.js';

// Dos niveles — todavía legible
import config from '../../config.js';
```

## Configuración del IDE

### VSCode / Cursor

El `tsconfig.json` ya está configurado. El autocompletado debería funcionar automáticamente.

Si VSCode no reconoce los paths, ejecuta:
1. `Cmd+Shift+P` → "TypeScript: Restart TS Server"
2. Verifica que estás usando el TypeScript del workspace (esquina inferior derecha)

### WebStorm / IntelliJ

Debería reconocer automáticamente los paths de `tsconfig.json`.

## Funcionamiento técnico

- **TypeScript** → `tsconfig.json` con `baseUrl` y `paths`
- **ESBuild** → `esbuild-plugin-path-alias` en `esbuild.config.js`
- **Vitest** → `resolve.alias` en `vitest.config.ts` (proyectos `unit` e `integration` comparten el mismo alias vía `extends: true`)
- **Cucumber** → `tsconfig-paths/esm` loader en `cucumber.js`

## Troubleshooting

### Error: "Cannot find module '@Contexts/...'"

1. Verifica que estás usando la extensión `.js` al final del import
2. Ejecuta `npm run build` para verificar que ESBuild resuelve los paths correctamente
3. En tests: verifica que Vitest tenga el alias configurado en el config correspondiente

### Autocompletado no funciona

1. Restart TypeScript Server en VSCode
2. Verifica que `tsconfig.json` tiene `baseUrl: "./"` descomentado
3. Cierra y vuelve a abrir el archivo

### Tests fallan con path aliases

- Unit e integration tests: verifica `vitest.config.ts` (sección `test.projects`)
- Acceptance tests: verifica que `cucumber.js` incluye `tsconfig-paths/esm` en los loaders
