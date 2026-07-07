# rubricae-cli parameter help reference

## `rb generate parameter`

```
Usage: rb generate parameter|p [options] [args...]

Genera un nuevo parámetro (Dominio o Controlador)

Options:
  -m, --multiple  Permite añadir múltiples parámetros de forma interactiva
  -h, --help      display help for command

Arguments (when type="aggregate"):
  1. type      "aggregate"
  2. context   Nombre del Contexto.          (PascalCase, e.g. Configs)
  3. module    Nombre del Módulo.            (PascalCase, e.g. Communicator)
  4. name      Nombre del Parámetro.         (camelCase, e.g. apiUrl)
  5. type      Tipo de Dato.                 (string | number | uuid | boolean | date | uri | enum)
  6. nullable  ¿Puede ser nulo?              (true | false)

Arguments (when type="controller"):
  1. type      "controller"
  2. app       Nombre de la App.             (lowercase, e.g. configs)
  3. module    Nombre del Módulo.            (PascalCase, e.g. Communicator)
  4. action    Acción del Controlador.       (create | update)
  5. name      Nombre del Parámetro.         (camelCase, e.g. apiUrl)
  6. type      Tipo de Dato.                 (string | number | boolean | uuid | uri | date-time | enum)
  7. location  Ubicación.                    (body | query)
  8. required  ¿Es obligatorio?              (true | false)
```

---

## `rb generate global-parameter`

```
Usage: rb generate global-parameter|gp [options] [args...]

Genera un parámetro global (transversal a todo el módulo)

Options:
  -m, --multiple  Permite añadir múltiples parámetros de forma interactiva
  -h, --help      display help for command

Arguments:
  1. context   Nombre del Contexto.          (PascalCase, e.g. Configs)
  2. module    Nombre del Módulo.            (PascalCase, e.g. Communicator)
  3. name      Nombre del Parámetro.         (camelCase, e.g. apiUrl)
  4. type      Tipo de Dato.                 (string | number | uuid | boolean | date | enum)
  5. nullable  ¿Puede ser nulo?              (true | false)
```

> `global-parameter` runs `domain` + `controller` in sequence for all generated actions.

---

## `rb generate from-file`

```
Usage: rb generate from-file|f <path>

Genera componentes a partir de un archivo JSON de configuración
```

**Real format** — the top-level key is the context name, then module name, then `use-cases` + `attributes`:

```json
{
  "Configs": {
    "Communicator": {
      "use-cases": [],
      "attributes": {
        "status": {
          "type": "enum",
          "nullable": false,
          "values": ["PENDING", "ACTIVE", "INACTIVE"]
        },
        "protocol": {
          "type": "enum",
          "nullable": false,
          "values": ["HTTP", "GRPC", "AMQP"]
        },
        "name": {
          "type": "string",
          "nullable": false
        }
      }
    }
  }
}
```

> Key differences vs what you might guess:
> - Top level is `{ "<Context>": { "<Module>": { ... } } }` — NOT `{ "context": "...", "module": "..." }`
> - Enum values key is `"values"` — NOT `"enumValues"`
> - `"use-cases": []` is required even when empty
