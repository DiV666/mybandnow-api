# rubricae-cli module help reference

## `rb generate module`

```
Usage: rb generate module|m [options] [args...]

Genera un módulo CRUD completo (Controladores, Casos de Uso, Dominio)

Options:
  -h, --help  display help for command

Arguments:
  1. type       Tipo de componente.               (context | controller)
  2. parent     Nombre del Contexto o App.        (PascalCase for context, lowercase for controller)
  3. module     Nombre del Módulo.                (PascalCase, e.g. Product)
  4. auth       (controller only) Autenticación.  (none | internal | bearer | bearer:<roles>)
                If omitted, asks interactively.

Examples:
  rb g m context Clitest Product                     # domain + all 5 use cases
  rb g m controller clitest Product bearer           # all 5 controllers with BearerAuth
  rb g m controller clitest Product bearer:admin     # all 5 with role "admin"
  rb g m controller clitest Product none             # all 5 without auth

* Use "null" to skip an argument and be prompted interactively.
```

---

## Typical patterns

### Full CRUD from scratch (no parameters)

```bash
rb g m context Clitest Product
rb g m controller clitest Product bearer
```

### Full CRUD with parameters

```bash
# 1. Domain + use cases
rb g m context Clitest Product

# 2. Add parameters
rb g gp Clitest Product name   string false
rb g gp Clitest Product price  number false

# 3. Controllers
rb g m controller clitest Product bearer
```

### Full CRUD with enum parameter (from-file)

```bash
rb g m context Clitest Product
# Add non-enum params
rb g gp Clitest Product name string false
# Add enum via from-file
rb g f product-config.json
# Controllers
rb g m controller clitest Product bearer:admin
```

`product-config.json` format:
```json
{
  "Clitest": {
    "Product": {
      "use-cases": [],
      "attributes": {
        "status": { "type": "enum", "nullable": false, "values": ["ACTIVE", "INACTIVE"] }
      }
    }
  }
}
```

---

## Non-interactive equivalences

`rb g m context Clitest Product` is equivalent to:
```bash
rb g a Clitest Product
rb g uc Clitest Product create
rb g uc Clitest Product update
rb g uc Clitest Product remove
rb g uc Clitest Product search
rb g uc Clitest Product matchByCriteria
```

`rb g m controller clitest Product bearer` is equivalent to:
```bash
rb g c clitest Product create         bearer
rb g c clitest Product update         bearer
rb g c clitest Product remove         bearer
rb g c clitest Product search         bearer
rb g c clitest Product matchByCriteria bearer
```
