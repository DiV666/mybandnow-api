# Trabajo futuro

## Uploads de vídeo largos

- **Problema actual**: el endpoint `POST /v1/songs/{songId}/instruments/{instrumentId}/upload` mantiene la request HTTP abierta hasta terminar la subida del archivo temporal a GCS.
- **Impacto**: clientes o proxies con timeouts agresivos pueden cancelar la request aunque el backend termine el flujo asíncrono correctamente.
- **Decisión para la POC**: aumentar el timeout del frontend para destrabar las pruebas sin cambiar la arquitectura.
- **Mejora futura deseada**:
  - evaluar upload directo a GCS con URL firmada, o
  - introducir una persistencia durable intermedia antes de responder `202 Accepted`.
- **Condición importante**: no responder éxito antes de que el archivo quede bajo control durable del sistema.
