# rubricae-cli use-case help reference

## `rb generate use-case`

```
Usage: rb generate use-case|uc [options] [args...]

Genera un caso de uso específico

Options:
  -h, --help  display help for command

Arguments:
  1. context   Nombre del Contexto.   (PascalCase, e.g. Clitest)
  2. module    Nombre del Módulo.     (PascalCase, e.g. Widget)
  3. action    Nombre de la Acción.   (create | update | remove | search | matchByCriteria)
```

---

## `rb generate module`

```
Usage: rb generate module|m [options] [args...]

Genera un módulo CRUD completo (Controladores, Casos de Uso, Dominio)

Options:
  -h, --help  display help for command

Arguments:
  1. type       Tipo de componente.   (context | controller)
  2. parent     Nombre del Contexto (si type="context") o App (si type="controller").
  3. module     Nombre del Módulo.

  * Usa "null" para saltar un argumento y preguntar interactivamente.
```

### `rb g m context` — generates domain + all 5 use cases

```bash
rb g m context Clitest Widget
# Generates:
#   rb g a Clitest Widget          (domain skeleton)
#   rb g uc Clitest Widget create
#   rb g uc Clitest Widget update
#   rb g uc Clitest Widget remove
#   rb g uc Clitest Widget search
#   rb g uc Clitest Widget matchByCriteria
```

### `rb g m controller` — generates controllers for an existing domain

```bash
rb g m controller clitest Widget
# Generates all 5 controllers:
#   WidgetPostCreateController
#   WidgetPutUpdateController
#   WidgetDeleteRemoveController
#   WidgetGetSearchController
#   WidgetGetMatchByCriteriaController
# Requires the use cases to exist first.
```

---

## Typical full workflow

```bash
# 1. Generate domain
rb g a Clitest Widget

# 2. Add parameters (before use cases)
rb g gp Clitest Widget name   string false
rb g gp Clitest Widget status string false
# (enum params via: rb g f config.json)

# 3. Generate all use cases
rb g uc Clitest Widget create
rb g uc Clitest Widget update
rb g uc Clitest Widget remove
rb g uc Clitest Widget search
rb g uc Clitest Widget matchByCriteria

# 4. Generate controllers
rb g m controller clitest Widget

# OR steps 1+3 together:
rb g m context Clitest Widget
# then add parameters
```
