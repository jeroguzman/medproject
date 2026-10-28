# Feature Specification: Captura de audio con consentimiento

**Feature Branch**: `work` (rama existente compartida; no se crean ramas automáticamente).

**Feature Directory**: `specs/002-captura-audio`

**Created**: 2026-10-28

**Status**: Draft — derivada de documentos; recomendaciones pendientes registradas.

**Input**: Crear especificaciones con los documentos del repositorio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Grabar o subir un audio (Priority: P1)

Como médico, quiero grabar o subir un audio para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Es la entrada principal del flujo de documentación.

**Independent Test**: Con un paciente seleccionado, completar grabación, pausa, reanudación y carga de un audio sintético. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** un paciente seleccionado y modo Dictado, **When** se graba, pausa, reanuda y detiene, **Then** se muestra tiempo y nivel de audio y se libera el micrófono al detener.
2. **Given** modo Consulta sin consentimiento, **When** se intenta grabar o subir audio, **Then** ambas acciones permanecen deshabilitadas y se explica el motivo.
3. **Given** un audio de hasta 20 minutos y 50 MB en un formato soportado, **When** se carga, **Then** queda disponible para reproducir y procesar sin guardarse permanentemente.

### User Story 2 - Añadir audio sin perder la revisión (Priority: P2)

Como médico, quiero añadir audio sin perder la revisión para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: RF-14 es deseable; protege el trabajo ya capturado.

**Independent Test**: Combinar un borrador editado con un segundo audio que contiene valores nuevos y contradictorios. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** campos ya llenados o editados, **When** se procesa otro audio, **Then** se conservan y solo se llenan campos vacíos sin origen; las listas reciben nuevos renglones sin alterar los existentes.

### User Story 3 - Ver transcripción durante la grabación (Priority: P3)

Como médico, quiero ver transcripción durante la grabación para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: RF-15 es opcional y no condiciona la demo.

**Independent Test**: Grabar un audio sintético con la mejora activada. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** una captura en curso, **When** se reciben fragmentos de transcripción, **Then** se muestran sin incorporarlos como nota autorizada ni persistir el audio.

### Edge Cases

- Sin permisos de micrófono se explica cómo habilitarlos y sigue disponible la carga de archivo.
- La grabación se detiene al llegar a 20 minutos; los archivos que exceden 20 minutos o 50 MB se rechazan.
- Al recargar se puede recuperar el borrador, pero no el audio que solo existía en memoria.
- La captura exige un paciente seleccionado; si cambia el paciente no se debe asociar silenciosamente el audio anterior.

## Requirements *(mandatory)*

### Functional Requirements

P1 agrupa M; P2 agrupa S; P3 agrupa C. Esta prioridad no transforma mejoras S/C en obligaciones M.

- **FR-009** (M; RF-09): Ofrecer los modos Dictado y Consulta con el paciente seleccionado antes de capturar.
- **FR-010** (M; RF-10): Exigir consentimiento explícito antes de grabar o subir audio de Consulta y conservarlo con la nota al autorizar.
- **FR-011** (M; RF-11): Grabar, pausar, reanudar y detener mostrando tiempo y nivel; detener a los 20 minutos y liberar el micrófono.
- **FR-012** (M; RF-12): Permitir cargar archivos hasta 50 MB y 20 minutos; los formatos candidatos son mp3, m4a, wav y webm, sujetos a verificación de compatibilidad.
- **FR-013** (M; RF-13): Mantener el audio solo temporalmente durante la captura y procesamiento; descartarlo tras éxito y nunca almacenarlo permanentemente.
- **FR-014** (S; RF-14): Añadir otro audio sin sobrescribir valores existentes o borrados deliberadamente; llenar solo campos vacíos sin origen y agregar renglones sin alterar los previos.
- **FR-015** (C; RF-15): Mostrar transcripción durante la grabación si se habilita esta mejora opcional.

### Quality & Privacy Requirements

- **RNF-01**: Usar solo datos ficticios y mostrar la etiqueta Datos ficticios.
- **RNF-02**: No persistir audio ni información clínica de la consulta antes de autorizar; tampoco en registros de depuración.
- **RNF-03**: Proteger el transporte de información y restringir los orígenes de acceso al frontend autorizado.
- **RNF-07**: Objetivo menor de 60 segundos por cada 5 minutos de audio; límite de 20 minutos por audio.
- **RNF-08**: Interfaz en español de México, tratamiento de tú y accesibilidad WCAG 2.2 AA; los estados no dependen solo del color.

### Key Entities

Captura: modo, duración, tamaño y audio temporal. Consentimiento: confirmación de grabación en modo Consulta ligada a la futura nota.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La prueba de Consulta sin consentimiento impide tanto grabar como subir archivos.
- **SC-002**: Las capturas de prueba permiten pausar, reanudar y detener; el límite de 20 minutos se cumple.
- **SC-003**: Los archivos que exceden duración o tamaño permitidos no llegan al procesamiento.
- **SC-004**: El audio no aparece en el almacenamiento persistente del navegador ni del servidor.

## Assumptions

- Un solo rol médico; escritorio, Chrome/Edge recientes y conexión a internet. Datos de demo ficticios.
- Dependencias: 001 proporciona paciente y sesión. 003 procesa el audio y 004 mantiene el borrador.
- Decisiones y verificaciones: Compatibilidad de mp3, m4a, wav y webm por validar con el proveedor antes de prometer soporte. Véase [registro transversal](../DECISIONES.md). Según §16 se trabaja con las recomendaciones mientras no se resuelvan.
- Las reglas detalladas de campos de §7.2–7.3 son el inventario de aceptación de la plantilla; no se reduce el formato a los ejemplos de esta especificación.
- Fuera de alcance: agenda, citas, firma electrónica, otros roles, FHIR, plantillas por especialidad, sincronización sin conexión y coordinación de varias pestañas.

## Sources & Traceability

- Fuente normativa: [REQUERIMIENTOS](../../docs/REQUERIMIENTOS.md), §§6–12 y §16; prevalece sobre la propuesta inicial.
- Detalle de interacción: [guía frontend](../../docs/equipo/german-frontend.md).
- Contratos y reglas de guardado: [guía backend](../../docs/equipo/jeroben-backend.md).
- Esquema, extracción y evaluación: [guía IA](../../docs/equipo/luis-ia.md).
- [Design System v0.4](../../docs/referencias/design-system-clinico-v0.4.html), con adaptaciones de §10.2; plantilla v1.1 según §7.
- Backlog relacionado (referencia, no tareas generadas): VC-09, VC-15.
- Aceptación de origen: CA-10.
