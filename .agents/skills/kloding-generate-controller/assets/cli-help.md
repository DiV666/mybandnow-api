# rubricae-cli controller help reference

## `rb generate controller`

```
Usage: rb generate controller|c [options] [args...]

Genera un controlador para una acción específica

Options:
  -h, --help  display help for command

Arguments:
  1. app       Nombre de la App.      (lowercase, e.g. clitest)
  2. module    Nombre del Módulo.     (PascalCase, e.g. Widget)
  3. action    Nombre de la Acción.   (create | update | remove | search | matchByCriteria)
  4. auth      Autenticación.         (none | internal | bearer | bearer:<roles>)
               Ejemplos: bearer  bearer:admin  bearer:admin,teacher  internal  none
               (Opcional. Si se omite, se pregunta interactivamente.)
```

---

## `rb generate module controller`

```
Usage: rb generate module|m [options] [args...]

Genera un módulo CRUD completo

Options:
  -h, --help  display help for command

Arguments:
  1. type     "controller"
  2. parent   Nombre de la App.      (lowercase, e.g. clitest)
  3. module   Nombre del Módulo.     (PascalCase, e.g. Widget)
```

Generates all 5 controllers in sequence:
  create → update → remove → search → matchByCriteria

Each controller requires its use case to exist. Controllers whose use case
is missing are silently skipped with a warning.

---

## Typical full workflow

```bash
# 1. Aggregate + use cases
rb g a Clitest Widget
rb g uc Clitest Widget create
rb g uc Clitest Widget update
rb g uc Clitest Widget remove
rb g uc Clitest Widget search
rb g uc Clitest Widget matchByCriteria

# OR: rb g m context Clitest Widget

# 2. All controllers at once (asks auth once, applies to all 5)
rb g m controller clitest Widget

# OR one by one with explicit auth:
rb g c clitest Widget create         bearer:admin,teacher
rb g c clitest Widget update         bearer:admin,teacher
rb g c clitest Widget remove         bearer:admin
rb g c clitest Widget search         bearer
rb g c clitest Widget matchByCriteria none
```

## Interactive auth prompt (when arg 4 is omitted)

```
? ¿Autenticación del endpoint?
  ❯ Bearer JWT (Keycloak)
    Interna (x-internal-auth)
    Sin autenticación

# If Bearer is chosen:
? Roles requeridos (deja vacío para cualquier token válido,
  o separa por comas si hay más de uno, ej: admin,teacher):
```
