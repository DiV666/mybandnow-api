# Documentación de la API mybandnow

Esta documentación describe el estado actual de la API REST de mybandnow y toma el código como fuente de verdad.

## Superficie actual

La API ya expone endpoints de negocio para:

- registro y login de usuarios
- creación y consulta de perfil musical
- gestión de bandas
- gestión de participaciones instrumentales por canción
- upload asíncrono de vídeo por instrumento

El stack operativo actual combina:

- PostgreSQL con Prisma
- RabbitMQ para eventos de dominio y procesos asíncronos
- Google Cloud Storage (GCS) para ficheros validados
- validación técnica de vídeo con `ffprobe`
- JWT local para `BearerAuth`

## Catálogo de endpoints

| Método   | Ruta                                                   | Descripción                                                       | Auth |
| -------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ---- |
| `POST`   | `/v1/users/register`                                   | Registra un usuario local                                         | No   |
| `POST`   | `/v1/auth/login`                                       | Devuelve un JWT local para consumo de la API                      | No   |
| `POST`   | `/v1/profile`                                          | Crea el perfil `Musician` del usuario autenticado                 | Sí   |
| `GET`    | `/v1/profile`                                          | Devuelve el perfil del usuario autenticado                        | Sí   |
| `GET`    | `/v1/musicians/{id}`                                   | Consulta pública de un músico por identificador                   | No   |
| `POST`   | `/v1/bands`                                            | Crea una banda                                                    | Sí   |
| `GET`    | `/v1/bands`                                            | Busca bandas por criterio                                         | Sí   |
| `PUT`    | `/v1/bands/{id}`                                       | Actualiza una banda                                               | Sí   |
| `DELETE` | `/v1/bands/{id}`                                       | Elimina una banda                                                 | Sí   |
| `GET`    | `/v1/bands/{id}`                                       | Consulta una banda por identificador                              | Sí   |
| `POST`   | `/v1/songs/{songId}/instruments`                       | Crea una participación instrumental dentro de una canción         | Sí   |
| `GET`    | `/v1/songs/{songId}/instruments/{instrumentId}`        | Devuelve la participación instrumental y su vídeo final si existe | Sí   |
| `POST`   | `/v1/songs/{songId}/instruments/{instrumentId}/upload` | Sube un vídeo MP4 para validación asíncrona                       | Sí   |

## Contenido

- [Arquitectura](./architecture.md) — contextos, capas y flujo asíncrono de `SongInstrument`
- [Configuración](./configuration.md) — variables de entorno validadas por Zod
- [Infraestructura](./infrastructure.md) — Prisma/PostgreSQL, RabbitMQ, GCS y validación con `ffprobe`
- [Autenticación](./auth.md) — `BearerAuth`, `InternalAuth` y reglas de autorización por recurso
- [Pruebas](./testing.md) — tests unitarios, integración y aceptación
- [Desarrollo](./development.md) — comandos `make` y flujo scaffold-first con `rb`
- [Pendientes de migración](./backup-migration-pending.md) — deuda y notas tras reconciliar el backup

Inicio rápido: consulta [README.md](../README.md).
