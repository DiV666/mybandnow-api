# Documentación de la API mybandnow

Esta documentación describe la plantilla base de microservicio REST de KLODING.

## Superficie actual

El repositorio expone la base de plataforma. La definición OpenAPI incluye componentes compartidos y esquemas de seguridad, pero todavía no publica endpoints de negocio.

## Contenido

- [Arquitectura](./architecture.md) — límites hexagonales, estructura de carpetas y patrones
- [Configuración](./configuration.md) — variables de entorno y validación de arranque
- [Infraestructura](./infrastructure.md) — MongoDB, RabbitMQ, Keycloak y servicios de soporte
- [Autenticación](./auth.md) — validación JWT y autenticación interna
- [Pruebas](./testing.md) — tests unitarios, de integración y de aceptación
- [Desarrollo](./development.md) — objetivos `make` y flujo local

Inicio rápido: consulta [README.md](../README.md).
