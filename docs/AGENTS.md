# Guía de Estilo de Comunicación — mybandnow

Cuando redactes documentación para este proyecto, sigue esta guía de estilo.

> **Nota de adaptación**: Esta guía se ha adaptado a partir de la guía de estilo de escritura técnica de prowler. Las secciones marcadas con `[ELIMINAR]` no aplican a este proyecto y pueden eliminarse en una revisión posterior.

---

## Voz y Tono

**mybandnow** es la plantilla base de microservicio REST de KLODING. La documentación de este proyecto:

- Está dirigida a equipos de desarrollo internos y partners técnicos de KLODING.
- Es **técnica y directa**. Sin frases de relleno ni marketing.
- Está escrita en **español**.
- Asume un lector técnico (desarrollador o arquitecto), pero define los términos no obvios en su primera aparición.

---

## Comunicación Inclusiva

mybandnow apunta a ser consumido por equipos diversos. Las comunicaciones deben ser inclusivas.

### Evitar Pronombres de Género

En la medida de lo posible, evitar referencias a pronombres de género (él, ella, su):

- Usar segunda persona para instrucciones directas (tú/usted/vos).
- Usar referencias en tercera persona no marcada (el usuario, el cliente, el desarrollador).
- En caso de necesitar un pronombre de género, usar formas neutrales cuando el español lo permita.
- Evitar construcciones dobles como él/ella, s/he, etc.

### Usar Alternativas a Sustantivos con Carga de Género

Evitar sustantivos que incluyan componentes de género innecesarios:

- Vendedor → Representante de ventas
- Hombre de negocios → Empresario, directivo
- Intermediario → Mediador, facilitador

### Diversidad e Inclusión

Cuando se incluyan ejemplos, asegurar representación diversa en cuanto a rol, experiencia, contexto cultural y nivel técnico.

### Lenguaje Claro y Accesible

- **Jerga técnica**: usar terminología técnica solo cuando el lector la conoce. Si hay duda, optar por lenguaje claro.
- **Argot**: minimizar el argot. Preferir lenguaje formal y neutral.

### Lenguaje Bélico y Militarista

Evitar referencias violentas o militaristas en contextos de seguridad informática:

- Combatir, eliminar → Gestionar, proteger, salvaguardar
- Atacante → Agente malicioso, actor de amenaza
- Primera línea de defensa → Capa de seguridad, protección perimetral
- Superficie de ataque externa → Puntos de exposición, vulnerabilidades externas

---

## Convenciones de Nomenclatura

### Entidades del Proyecto

Las siguientes entidades del proyecto son sustantivos propios y deben referenciarse con mayúscula inicial y sin artículo:

- **API** — el microservicio en su conjunto
- **Bounded Context** — el contexto de dominio principal
- **Módulo** — cada módulo de negocio dentro del contexto
- **Bus de Comandos** / **Bus de Eventos** — los buses de mensajería internos
- **Repositorio de Persistencia** / **Repositorio de Comunicaciones** — los contratos de puerto

[ELIMINAR — lista completa de Prowler Features (Prowler App, Prowler CLI, Prowler SDK, Built-in Compliance Checks, etc.)]: _No aplica a este proyecto._

---

## Construcciones Verbales en la Escritura Técnica

Preferir construcciones verbales (con verbo) sobre nominales (con sustantivo). Las construcciones nominales introducen complejidad innecesaria.

- **Nominal**: "La creación del reporte fue satisfactoria."
- **Verbal**: "El reporte se creó satisfactoriamente."

Las construcciones verbales también tienden a usar menos palabras:

- **Nominal**: "La implementación de la solución redujo el tiempo de inactividad del sistema."
- **Verbal**: "La solución redujo el tiempo de inactividad del sistema."

Elegir construcciones verbales sobre nominales siempre que sea posible.

### Los Verbos Expresan el Propósito

- **Ejemplo 1 (nominal)**: Recomendación para múltiples entornos
- **Ejemplo 2 (verbal)**: Cómo gestionar múltiples entornos

El ejemplo 2 es más claro. Los verbos expresan el propósito y deben usarse siempre que sea posible.

---

## Evitar la Segunda Persona Salvo en Instrucciones Directas

El uso explícito de pronombres de segunda persona (tú, tu, vos) debe minimizarse salvo en instrucciones directas en modo imperativo.

**Original:**

> mybandnow puede instalarse de diferentes formas, dependiendo de tu entorno.

**Mejorado:**

> mybandnow ofrece métodos de instalación adaptables a distintos entornos.

---

## Mayúsculas

[ELIMINAR — reglas de Title Case en inglés]: _El inglés usa Title Case en títulos. En español, los títulos y encabezados usan mayúscula solo en la primera palabra y en nombres propios._

### Reglas de Mayúsculas en Español

- **Títulos y encabezados**: mayúscula solo en la primera palabra y en nombres propios.
  - Correcto: `Arquitectura del módulo de órdenes`
  - Incorrecto: `Arquitectura Del Módulo De Órdenes`
- **Acrónimos**: mantener en mayúsculas (API, JWT, DDD, RabbitMQ).
- **No usar mayúsculas para énfasis**. Usar **negrita** en su lugar.
- **Lenguajes y estándares**: HTML, JSON, YAML, TypeScript → en mayúsculas según su denominación oficial.
- **Leyes y normativas**: seguir la capitalización oficial del texto legal.

### Capitalización Interna de Palabras

Evitar la capitalización interna en texto continuo salvo que sea parte de un nombre propio o marca (e.g., no escribir E-Mail ni E-Book, sino email o e-book).

[ELIMINAR — reglas de capitalización de acrónimos en inglés ("do not capitalize the individual words of the spelled-out form")]: _No aplica directamente al español; seguir la convención oficial de cada sigla._

---

## Guiones

Usar guion para modificadores compuestos en posición prenominal (antes del sustantivo):

- Correcto: `un endpoint bien documentado`
- Correcto (con guion): `una API bien-definida` — solo cuando la ambigüedad lo justifica.

No usar guion en posición postnominal (predicado):

- Correcto: `el endpoint está bien documentado`

[ELIMINAR — nota sobre guiones y SEO en URLs]: _Aplica al SEO de documentación pública. Si la documentación es interna, esta consideración no es relevante. Si en algún momento la documentación es pública, recuperar esta nota._

---

## Listas con Viñetas

Las viñetas mejoran la legibilidad, la retención y la organización visual del contenido.

### Cuándo Usar Viñetas

Recomendadas cuando:

- La información se puede dividir en múltiples categorías con características propias.
- Cada ítem es suficientemente significativo como concepto independiente.

**Original (sin viñetas):**

> Soporta validación de entrada, enmascaramiento de PII, gestión de excepciones y publicación de eventos de dominio.

**Mejorado con viñetas:**

> El módulo incluye:
>
> - Validación de entrada en los value objects del dominio
> - Enmascaramiento de PII en los logs
> - Gestión de excepciones con mapeo a códigos HTTP
> - Publicación de eventos de dominio tras cada cambio de estado

### Puntuación de Viñetas

Mantener consistencia dentro de cada lista. Tres opciones válidas:

- **Sin puntuación** — para listas de elementos cortos sin verbo:
  - `SmsCreatedDomainEvent`
  - `SmsErrorDomainEvent`
  - `SmsUpdatedDomainEvent`

- **Con punto final** — para viñetas que forman oraciones completas con verbo:
  - `EntityCreate` crea la entidad en estado inicial y delega las operaciones al provider.
  - `EntityUpdate` actualiza campos de la entidad existente en base de datos.

- **Con punto y coma (evitar)** — estilo en desuso. Evitar siempre que sea posible.

### Ventajas de Añadir Encabezados a las Viñetas

Añadir encabezados en negrita a los ítems de una lista mejora la escaneabilidad y la comprensión rápida:

- **Capa de dominio**: aggregates, value objects, domain events, repository interfaces.
- **Capa de aplicación**: use cases, commands, queries, handlers.
- **Capa de infraestructura**: repositorios MongoDB, providers HTTP, event bus RabbitMQ.

---

## Comillas

[ELIMINAR — reglas de comillas en inglés americano (double/single quotation marks)]: _Las reglas de comillas inglesas no aplican a la documentación en español._

### Comillas en Español

En español se usan preferentemente las comillas angulares o españolas: `«»`.

- Para citas directas: «El endpoint devuelve 201 cuando el recurso se crea correctamente.»
- Para términos técnicos en contexto narrativo: el concepto «provider» se refiere al proveedor externo.
- En entornos donde las comillas españolas no estén disponibles, usar comillas inglesas dobles: `"provider"`.

### Comillas en Documentación de Software

Para elementos de la interfaz o valores exactos de entrada en código, usar **comillas inglesas dobles** o **backticks** según el contexto:

- Referencia a un valor de configuración: escribe `"nrs360"` en el campo `provider`.
- Referencia a un campo de la API: el campo `"id"` debe ser un UUID válido.
- Preferir backticks para nombres de campos, rutas, comandos y valores literales: `` `id` ``, `` `make unit-tests` ``.

---

## Verbos de Interacción en Documentación de Software

[ELIMINAR — sección de verbos táctiles (tap, swipe, pinch, double-tap)]: _No aplica a documentación de API REST. Este proyecto no tiene interfaz gráfica de usuario._

Para documentación de API, usar los verbos correctos según el contexto:

| Acción                  | Verbo recomendado     | Ejemplo                                      |
| ----------------------- | --------------------- | -------------------------------------------- |
| Llamar a un endpoint    | Enviar / Realizar     | Envía una petición `POST` a `/v1/entities`   |
| Proporcionar un valor   | Incluir / Pasar       | Incluye el campo `id` en el body             |
| Ver la respuesta        | Consultar / Verificar | Verifica que la respuesta tenga código `201` |
| Ejecutar un comando     | Ejecutar / Correr     | Ejecuta `make unit-tests`                    |
| Configurar una variable | Definir / Establecer  | Establece `PROVIDER_TOKEN` en el entorno     |

---

## Estructura de Frases en Escritura Técnica

Al escribir documentación técnica, colocar el objetivo al inicio de la frase mejora la claridad y la escaneabilidad.

**Opción 1 (menos recomendada):**

> Abre una terminal y ejecuta el siguiente comando para crear un nuevo rol personalizado.

**Opción 2 (recomendada):**

> Para crear un nuevo rol personalizado, abre una terminal y ejecuta el siguiente comando.

### Principios Clave

- Colocar la acción o el objetivo primero, seguido de los pasos.
- Redactar pensando en cómo el lector buscaría la información.
- La regla práctica: «Para qué» precede al «cómo».

---

## Títulos y Encabezados

Los encabezados mejoran la navegación, la legibilidad y la estructura del documento.

### Jerarquía de Encabezados

```markdown
# Título del documento (H1) — uno por documento

## Sección principal (H2)

### Subsección (H3)

#### Detalle específico (H4) — usar con moderación
```

### Cómo Redactar Buenos Encabezados

- **Ser descriptivo**: indicar claramente qué cubre la sección.
  - Pobre: `Introducción`
  - Bueno: `Cómo instalar y configurar mybandnow en local`
- **Ser conciso**: lenguaje preciso, sin palabras innecesarias.
- **Mantener consistencia**: aplicar el mismo estilo en todo el documento.
- **Evitar caracteres especiales**: limitar la puntuación en encabezados.

### Capitalización de Encabezados (español)

Mayúscula solo en la primera palabra y nombres propios:

- Correcto: `Cómo añadir un nuevo proveedor externo`
- Incorrecto: `Cómo Añadir Un Nuevo Proveedor Externo`

---

[ELIMINAR — sección entera "Version Badge for Feature Documentation"]: _Esta sección describe un componente MDX de Mintlify (`<VersionBadge version="..." />`). Este proyecto no usa Mintlify ni MDX para su documentación. Si en el futuro se adopta una plataforma de documentación con soporte MDX, recuperar y adaptar esta sección._

---

## Evitar Suposiciones sobre el Conocimiento del Lector

### Ajustar el Nivel de Detalle

El lector objetivo es un desarrollador técnico, pero no debe asumirse conocimiento previo del stack específico de este proyecto.

### Definir Términos y Acrónimos en su Primera Aparición

Incluso con un lector técnico, algunos términos pueden ser ambiguos:

- Al mencionar DDD por primera vez: Domain-Driven Design (DDD)
- Al mencionar CQRS: Command Query Responsibility Segregation (CQRS)
- Al mencionar PII: Información de Identificación Personal (PII, del inglés _Personally Identifiable Information_)

### No Asumir Conocimiento Implícito

Si un proceso depende de pasos previos, referenciarlos brevemente:

> Antes de configurar las variables de entorno, asegúrate de que el contenedor de Docker está levantado (`docker compose up -d`).

### Proporcionar Ejemplos Suficientes

Los ejemplos concretos reducen la ambigüedad. Incluir al menos un ejemplo por cada concepto no trivial.

### Evitar el Exceso de Notas

Las notas son frecuentemente ignoradas por el lector y saturan el texto. Usarlas con moderación, solo para información adicional no esencial.

---

## Uso de Advertencias para Información Crítica

En documentación técnica, las advertencias destacan riesgos críticos y guían al usuario para evitar errores graves.

### Niveles de Severidad

- **Nota**: información adicional o buenas prácticas (severidad baja).
- **Advertencia**: problema potencial si no se siguen las instrucciones (severidad media).
- **Peligro**: acción que puede causar consecuencias graves como pérdida de datos o fallo del sistema (severidad alta).

### Explicar las Consecuencias

Cada advertencia debe describir explícitamente el impacto de ignorarla:

- **Bueno**: Desactivar el enmascaramiento de PII expondrá números de teléfono reales en los logs de producción.
- **Pobre**: No desactivar el enmascaramiento de PII.

### Proporcionar Pasos de Remediación

Siempre que sea posible, dirigir al lector a una guía de resolución o a los pasos para mitigar el problema.

**Ejemplo:**

> **⚠️ Advertencia**: Modificar `EntityStatusValues` sin actualizar `fromPrimitives()` y `toPrimitives()` en el agregado correspondiente causará fallos silenciosos en la deserialización de documentos MongoDB existentes. Consulta el ADR de arquitectura hexagonal antes de añadir nuevos estados.
