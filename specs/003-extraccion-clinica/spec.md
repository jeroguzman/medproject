# Feature Specification: Transcripción y prellenado clínico verificable

**Feature Branch**: `work` (rama existente compartida; no se crean ramas automáticamente).

**Feature Directory**: `specs/003-extraccion-clinica`

**Created**: 2026-10-28

**Status**: Draft — derivada de documentos; recomendaciones pendientes registradas.

**Input**: Crear especificaciones con los documentos del repositorio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Obtener un borrador a partir del audio (Priority: P1)

Como médico, quiero obtener un borrador a partir del audio para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Demuestra el valor central sin redactar desde cero.

**Independent Test**: Procesar un dictado y una consulta sintéticos y comparar con los resultados esperados. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** audio válido, **When** el médico pulsa Procesar, **Then** ve las etapas de transcripción y llenado y recibe transcripción, borrador y alertas sin registros nuevos de la consulta en el servidor.
2. **Given** la frase niega alergias pero no menciona antecedentes familiares, **When** se prellena el formato, **Then** alergias queda negado y los antecedentes no mencionados quedan sin información.
3. **Given** la transcripción no contiene diagnóstico ni tratamiento expresados por el médico, **When** se prellena, **Then** esos campos no se completan por inferencia; identificación y autorización nunca las llena la IA.
4. **Given** un fallo de procesamiento, **When** termina el intento, **Then** se explica el error y se conserva el audio temporal para reintentar.

### User Story 2 - Revisar respaldo y coincidencia de paciente (Priority: P2)

Como médico, quiero revisar respaldo y coincidencia de paciente para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Evidencia visible y coincidencia son mejoras S; la ausencia de invenciones sigue siendo obligatoria.

**Independent Test**: Usar una cita inexistente y un audio que menciona otro paciente. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** un valor propuesto sin respaldo, **When** se aplica el filtro de evidencia habilitado, **Then** el valor se descarta y se muestra un aviso sin evidencia.
2. **Given** un nombre mencionado distinto del seleccionado, **When** se detecta la discrepancia con la mejora activada, **Then** una alerta crítica bloquea autorizar hasta confirmar al paciente correcto o cambiarlo.

### Edge Cases

- El fallo de formato de la respuesta admite un reintento según §8.3; si vuelve a fallar se devuelve error, no una nota parcial autorizada.
- Un audio sin nombre mencionado no cambia al paciente ni dispara por sí solo una discrepancia.
- En Consulta no se atribuyen al médico diagnósticos o tratamientos que solo dijo el paciente; el hablante no identificado permanece desconocido.
- La extracción no usa recuerdos de otros pacientes ni añade datos identificativos del expediente al mensaje de extracción.

## Requirements *(mandatory)*

### Functional Requirements

P1 agrupa M; P2 agrupa S; P3 agrupa C. Esta prioridad no transforma mejoras S/C en obligaciones M.

- **FR-016** (M; RF-16): Transcribir y prellenar mostrando etapas de avance comprensibles.
- **FR-017** (M; RF-17): Entregar transcripción, borrador y alertas sin persistir información clínica de la consulta antes de autorizar.
- **FR-018** (M; RF-18): Explicar fallos y conservar el audio temporal para reintentar mientras siga abierta la captura.
- **FR-019** (M; RF-19): Impedir que la IA complete identificación o autorización; no inferir diagnósticos, pronósticos o tratamientos no expresados por el médico.
- **FR-020** (S; RF-20): Asociar cada valor propuesto a citas textuales de respaldo y descartar valores sin evidencia con un aviso cuando se active el filtro S.
- **FR-021** (S; RF-21): Alertar y bloquear la autorización si el nombre mencionado no coincide con el paciente seleccionado, hasta confirmar o cambiar al paciente.

### Quality & Privacy Requirements

- **RNF-01**: Usar solo datos ficticios y mostrar la etiqueta Datos ficticios.
- **RNF-02**: No persistir audio ni información clínica de la consulta antes de autorizar; tampoco en registros de depuración.
- **RNF-04**: Exigir autenticación en las operaciones clínicas; proteger las integraciones y no exponer credenciales al usuario.
- **RNF-07**: Objetivo menor de 60 segundos por cada 5 minutos de audio; límite de 20 minutos por audio.
- **RNF-09**: La IA documenta; no diagnostica, prescribe ni sugiere tratamiento.

### Key Entities

Transcripción: texto y segmentos por hablante. Propuesta clínica: campos y listas de la plantilla. Evidencia: cita literal. Alerta: tipo, campo, severidad y bloqueo. Caso de evaluación: guion sintético y resultado esperado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cada audio de aceptación de hasta 5 minutos produce un formato prellenado en menos de 60 segundos, con el origen visible (CA-01, RNF-07).
- **SC-002**: En el conjunto de 4 a 6 casos sintéticos hay cero datos inventados; se reportan campos correctos, omitidos y duración sin inventar una meta de precisión no acordada.
- **SC-003**: Procesar y editar no crea registros clínicos de la consulta ni archivos persistentes de audio.
- **SC-004**: Los casos negado/no mencionado conservan estados distintos y ningún caso completa identificación o autorización mediante IA.
- **SC-005**: Con la mejora S activada, el caso de nombre distinto bloquea autorización hasta resolver la alerta.

## Assumptions

- Un solo rol médico; escritorio, Chrome/Edge recientes y conexión a internet. Datos de demo ficticios.
- Dependencias: 002 entrega audio y modo; 001 aporta contexto del paciente. 004 recibe el resultado sin autorizarlo.
- Decisiones y verificaciones: P-07; las discrepancias de validación y prioridad del filtro de evidencia están en ../DECISIONES.md. Véase [registro transversal](../DECISIONES.md). Según §16 se trabaja con las recomendaciones mientras no se resuelvan.
- Las reglas detalladas de campos de §7.2–7.3 son el inventario de aceptación de la plantilla; no se reduce el formato a los ejemplos de esta especificación.
- Fuera de alcance: agenda, citas, firma electrónica, otros roles, FHIR, plantillas por especialidad, sincronización sin conexión y coordinación de varias pestañas.

## Sources & Traceability

- Fuente normativa: [REQUERIMIENTOS](../../docs/REQUERIMIENTOS.md), §§6–12 y §16; prevalece sobre la propuesta inicial.
- Detalle de interacción: [guía frontend](../../docs/equipo/german-frontend.md).
- Contratos y reglas de guardado: [guía backend](../../docs/equipo/jeroben-backend.md).
- Esquema, extracción y evaluación: [guía IA](../../docs/equipo/luis-ia.md).
- [Design System v0.4](../../docs/referencias/design-system-clinico-v0.4.html), con adaptaciones de §10.2; plantilla v1.1 según §7.
- Backlog relacionado (referencia, no tareas generadas): VC-01, VC-10 a VC-15, VC-18 a VC-20, VC-27.
- Aceptación de origen: CA-01, CA-02, CA-04, CA-05, CA-11.
