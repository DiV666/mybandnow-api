# Trabajo futuro

## Uploads de vídeo largos

- **Problema actual**: el endpoint `POST /v1/songs/{songId}/instruments/{instrumentId}/upload` mantiene la request HTTP abierta hasta terminar la subida del archivo temporal a GCS.
- **Impacto**: clientes o proxies con timeouts agresivos pueden cancelar la request aunque el backend termine el flujo asíncrono correctamente.
- **Decisión para la POC**: aumentar el timeout del frontend para destrabar las pruebas sin cambiar la arquitectura.
- **Mejora futura deseada**:
  - evaluar upload directo a GCS con URL firmada, o
  - introducir una persistencia durable intermedia antes de responder `202 Accepted`.
  - para reproducción/descarga, dejar de exponer keys internas (`song-instrument-uploads/...`) y resolverlas bajo demanda vía backend/proxy que entregue una URL firmada corta o haga streaming controlado.
- **Condición importante**: no responder éxito antes de que el archivo quede bajo control durable del sistema.

## Invitaciones por email para bandas y asignaciones

- **Decisión actual de la POC**:
  - `POST /v1/bands/{bandId}/members` solo acepta emails que ya resuelven a un usuario existente con perfil de músico.
  - `PATCH /v1/songs/{songId}/instruments/{instrumentId}` asigna directamente por `musicianId`.
  - `POST /v1/songs/{songId}/instruments/{instrumentId}/invite` resuelve `musicianEmail` de forma **síncrona**: si el músico existe, lo añade a la banda si hace falta y lo asigna automáticamente al instrumento.
  - si el email no existe o todavía no tiene perfil de músico, el backend responde error.
- **Mejora futura deseada**:
  - mantener el endpoint dedicado `POST /v1/songs/{songId}/instruments/{instrumentId}/invite`, pero cambiar su implementación interna a un flujo **asíncrono**.
  - crear una entidad de invitación pendiente para banda y otra variante con **intención de asignación** para canción/instrumento.
  - persistir como mínimo:
    - `bandId`,
    - `email`,
    - `invitedByMusicianId`,
    - `status` (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`),
    - y, para invitaciones desde canción, `pendingAssignment { songId, instrumentId }`.
  - enviar un email transaccional con link seguro de aceptación.
  - al aceptar la invitación:
    - materializar la membresía en la banda,
    - consumir la intención pendiente si existe,
    - y completar automáticamente la asignación del instrumento.
- **Dirección de diseño recomendada**:
  - mantener separados los dos casos de uso:
    - invitación simple a banda,
    - invitación desde canción con intención de asignación.
  - reutilizar el endpoint `/invite` de canción para no romper el contrato del frontend cuando el flujo pase de síncrono a asíncrono.
  - evitar mezclar la asignación normal por `musicianId` con la lógica de invitación por email.
- **Riesgos a resolver más adelante**:
  - expiración y revocación de invitaciones,
  - evitar duplicados si se reenvía al mismo email,
  - conflictos si el instrumento cambia de músico mientras la invitación sigue pendiente,
  - auditar quién invitó, cuándo y a qué banda/canción,
  - decidir si el backend crea primero el usuario/perfil o si la aceptación obliga a completar onboarding antes de materializar la asignación.

## Internacionalización del catálogo de instrumentos

- **Problema actual**: el catálogo `Instruments` guarda `name` y `description` como texto plano en un único idioma.
- **Decisión temporal**: mantener los textos en español para avanzar con la POC y el seed inicial.
- **Riesgo si se escala así**:
  - el nombre corto puede resolverse con facilidad en cliente,
  - pero las descripciones largas, historia, galerías o contenido editorial no deberían duplicarse entre web y móvil.
- **Propuesta futura**:
  - añadir un `code` estable por instrumento para etiquetas cortas,
  - mantener el contenido largo traducible en una fuente única compartida,
  - modelar traducciones persistidas en backend/DB o mover ese contenido a un CMS si negocio necesita edición frecuente.
- **Dirección recomendada**:
  - **labels cortos** (`name` visible en selects, filtros, etc.): `code` + diccionarios i18n en frontend,
  - **contenido rico** (`description`, historia, fotos, bloques editoriales): traducciones centralizadas en backend/CMS consumidas por web y móvil.
