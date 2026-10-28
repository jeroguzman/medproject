# Feature Specification: Consulta y herramientas de apoyo opcionales

**Feature Branch**: `work` (rama existente compartida; no se crean ramas automáticamente).

**Feature Directory**: `specs/006-funciones-apoyo`

**Created**: 2026-10-28

**Status**: Draft — derivada de documentos; recomendaciones pendientes registradas.

**Input**: Crear especificaciones con los documentos del repositorio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar y exportar el expediente (Priority: P2)

Como médico, quiero consultar y exportar el expediente para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: RF-38, RF-42 y RF-43 son deseables.

**Independent Test**: Consultar un paciente con dos versiones y un borrador local; luego exportar una nota y revisar la bitácora. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** notas autorizadas y un borrador, **When** se pregunta por el paciente, **Then** la respuesta usa solo las últimas versiones autorizadas de ese paciente y cita la nota de origen.
2. **Given** una nota autorizada, **When** se exporta, **Then** el documento refleja su contenido y el diseño de la plantilla.
3. **Given** acciones de ver, autorizar, corregir o exportar, **When** se consulta la bitácora, **Then** se identifica quién actuó, qué acción realizó, sobre qué nota y cuándo.

### User Story 2 - Usar referencias, catálogo y reporte de errores (Priority: P3)

Como médico, quiero usar referencias, catálogo y reporte de errores para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: RF-39, RF-40, RF-41 y RF-44 son opcionales.

**Independent Test**: Buscar una referencia, seleccionar un código y reportar un campo de una consulta ficticia. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** un término de diagnóstico o medicamento, **When** se buscan referencias, **Then** se muestran enlaces sin rellenar campos y sin enviar nombres, expedientes ni texto clínico del paciente.
2. **Given** alergia y medicamento coincidentes, **When** se valida con la mejora habilitada, **Then** aparece una alerta en el renglón; su política de bloqueo queda definida antes de implementarla.
3. **Given** un diagnóstico, **When** se usa el catálogo corto, **Then** el médico puede elegir su código sin recibir un diagnóstico inventado.
4. **Given** un campo con error de IA, **When** se reporta, **Then** el reporte externo contiene solo identificadores y el nombre del campo, sin datos clínicos.

### Edge Cases

- Sin notas autorizadas no se responde usando el borrador ni datos de otro paciente.
- Una memoria externa desactualizada no debe presentar una versión reemplazada como vigente.
- Un fallo de sincronización posterior a autorizar no revierte ni bloquea la autorización ya completada.
- La guía frontend admite justificación para alerta de alergia y la guía IA solo describe bloqueo: decidir la excepción en el plan.

## Requirements *(mandatory)*

### Functional Requirements

P1 agrupa M; P2 agrupa S; P3 agrupa C. Esta prioridad no transforma mejoras S/C en obligaciones M.

- **FR-038** (S; RF-38): Responder preguntas solo con las últimas versiones autorizadas del paciente seleccionado y citar las notas de origen.
- **FR-039** (C; RF-39): Mostrar enlaces de referencia a partir de un término, sin rellenar campos y sin transmitir identidad ni texto clínico del paciente.
- **FR-040** (C; RF-40): Mostrar alerta en el renglón del medicamento incompatible con alergias registradas; resolver la política de excepción antes de implementar.
- **FR-041** (C; RF-41): Permitir seleccionar CIE-10 desde un catálogo corto sin generar diagnósticos automáticamente.
- **FR-042** (S; RF-42): Exportar exclusivamente notas autorizadas a PDF con el diseño de la plantilla.
- **FR-043** (S; RF-43): Registrar quién vio, autorizó, corrigió o exportó una nota y cuándo.
- **FR-044** (C; RF-44): Reportar un error de IA mediante identificadores y nombre del campo exclusivamente, sin datos clínicos en el reporte externo.

### Quality & Privacy Requirements

- **RNF-01**: Usar solo datos ficticios y mostrar la etiqueta Datos ficticios.
- **RNF-04**: Exigir autenticación en las operaciones clínicas; proteger las integraciones y no exponer credenciales al usuario.
- **RNF-05**: No enviar nombres, expedientes o texto clínico del paciente a servicios de referencias ni de reporte de errores.
- **RNF-08**: Interfaz en español de México, tratamiento de tú y accesibilidad WCAG 2.2 AA; los estados no dependen solo del color.
- **RNF-09**: La IA documenta; no diagnostica, prescribe ni sugiere tratamiento.

### Key Entities

Respuesta sobre expediente con citas. Referencia externa con enlace. Exportación de nota autorizada. Evento de bitácora. Reporte de campo con identificadores sin contenido clínico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las respuestas de los casos de prueba citan exclusivamente notas vigentes autorizadas del paciente seleccionado.
- **SC-002**: Una exportación representa la nota autorizada elegida; un borrador no se exporta como nota autorizada.
- **SC-003**: Las peticiones externas de referencias y reporte contienen cero nombres, expedientes o texto clínico del paciente.
- **SC-004**: La bitácora identifica actor, acción, entidad y fecha de cada evento cubierto sin registrar cuerpos clínicos.

## Assumptions

- Un solo rol médico; escritorio, Chrome/Edge recientes y conexión a internet. Datos de demo ficticios.
- Dependencias: 001 identifica al paciente y 004/005 proporcionan notas autorizadas y versiones. Esta funcionalidad completa es S/C y no bloquea el MVP M.
- Decisiones y verificaciones: La vía PDF difiere entre §9.4 y el backlog/guía frontend; decidir en el plan sin cambiar el resultado esperado. Véase [registro transversal](../DECISIONES.md). Según §16 se trabaja con las recomendaciones mientras no se resuelvan.
- Las reglas detalladas de campos de §7.2–7.3 son el inventario de aceptación de la plantilla; no se reduce el formato a los ejemplos de esta especificación.
- Fuera de alcance: agenda, citas, firma electrónica, otros roles, FHIR, plantillas por especialidad, sincronización sin conexión y coordinación de varias pestañas.

## Sources & Traceability

- Fuente normativa: [REQUERIMIENTOS](../../docs/REQUERIMIENTOS.md), §§6–12 y §16; prevalece sobre la propuesta inicial.
- Detalle de interacción: [guía frontend](../../docs/equipo/german-frontend.md).
- Contratos y reglas de guardado: [guía backend](../../docs/equipo/jeroben-backend.md).
- Esquema, extracción y evaluación: [guía IA](../../docs/equipo/luis-ia.md).
- [Design System v0.4](../../docs/referencias/design-system-clinico-v0.4.html), con adaptaciones de §10.2; plantilla v1.1 según §7.
- Backlog relacionado (referencia, no tareas generadas): VC-22 a VC-26; reporte de errores sin ID VC asignado en el backlog.
- Aceptación de origen: sin CA propio en §12; escenarios y SC de esta especificación detallan las funciones S/C.
