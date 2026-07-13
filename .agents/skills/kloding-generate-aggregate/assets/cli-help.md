# rubricae-cli help reference

## `rb generate` (top level)

```
Usage: rb generate|g [options] [command]

Crea nuevos componentes de la aplicación

Commands:
  module|m [args...]                       Genera un módulo CRUD completo
  controller|c [args...]                   Genera un controlador para una acción específica
  aggregate|a [args...]                    Genera la capa de dominio para un módulo
  use-case|uc [args...]                    Genera un caso de uso específico
  service|s [args...]                      Genera un servicio de infraestructura compartido
  subscriber|sub [args...]                 Genera un suscriptor de eventos de dominio
  parameter|p [options] [args...]          Genera un nuevo parámetro (Dominio o Controlador)
  global-parameter|gp [options] [args...]  Genera un parámetro global (transversal a todo el módulo)
  from-file|f <path>                       Genera componentes a partir de un archivo JSON de configuración
```

---

## `rb generate aggregate`

```
Usage: rb generate aggregate|a [options] [args...]

Genera la capa de dominio para un módulo

Options:
  -h, --help  display help for command

Arguments:
  1. context   Nombre del Contexto.   (PascalCase, e.g. Configs)
  2. module    Nombre del Módulo.     (PascalCase, e.g. Communicator)
```

---

## `rb generate use-case`

```
Usage: rb generate use-case|uc [options] [args...]

Genera un caso de uso específico

Options:
  -h, --help  display help for command

Arguments:
  1. context   Nombre del Contexto.
  2. module    Nombre del Módulo.
  3. action    Nombre de la Acción.   (create | update | remove | search | matchByCriteria)
```

---

## `rb generate parameter`

```
Usage: rb generate parameter|p [options] [args...]

Genera un nuevo parámetro (Dominio o Controlador)

Options:
  -m, --multiple  Permite añadir múltiples parámetros de forma interactiva
  -h, --help      display help for command

Arguments (when type="aggregate"):
  1. type      "aggregate"
  2. context   Nombre del Contexto.
  3. module    Nombre del Módulo.
  4. name      Nombre del Parámetro.   (camelCase, e.g. apiUrl)
  5. type      Tipo de Dato.           (string | number | uuid | boolean | date | enum | uri)
  6. nullable  ¿Puede ser nulo?        (true | false)

Arguments (when type="controller"):
  1. type      "controller"
  2. app       Nombre de la App.
  3. module    Nombre del Módulo.
  4. action    Acción del Controlador.
  5. name      Nombre del Parámetro.
  6. type      Tipo de Dato.
  7. location  "body" | "query"
  8. required  ¿Es obligatorio?        (true | false)
```

---

## `rb generate module`

```
Usage: rb generate module|m [options] [args...]

Genera un módulo CRUD completo (Controladores, Casos de Uso, Dominio)

Options:
  -h, --help  display help for command

Arguments:
  1. type       "controller" | "context"
  2. parent     Nombre del Contexto (si type="context") o App (si type="controller")
  3. module     Nombre del Módulo.

* Usa "null" para saltar un argumento y preguntar interactivamente.
```
