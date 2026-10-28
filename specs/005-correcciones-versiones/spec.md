# Feature Specification: Correcciones autorizadas e historial de versiones

**Feature Branch**: `work` (rama existente compartida; no se crean ramas automáticamente).

**Feature Directory**: `specs/005-correcciones-versiones`

**Created**: 2026-10-28

**Status**: Draft — derivada de documentos; recomendaciones pendientes registradas.

**Input**: Crear especificaciones con los documentos del repositorio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corregir sin sobrescribir (Priority: P1)

Como médico, quiero corregir sin sobrescribir para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Permite rectificar conservando la historia clínica.

**Independent Test**: Corregir una nota de demo y comparar las versiones 1 y 2. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** una nota autorizada, **When** el médico pulsa Corregir, **Then** se abre una copia local; la versión vigente permanece sin cambios.
2. **Given** una corrección sin motivo, **When** se intenta autorizar, **Then** se rechaza y se pide motivo.
3. **Given** una corrección válida con motivo, **When** se autoriza, **Then** se crea la versión 2, pasa a Corregida y la versión 1 sigue consultable con su contenido intacto.
4. **Given** una copia local descartada, **When** se vuelve al historial, **Then** la versión vigente permanece exactamente igual.

### User Story 2 - Consultar versiones y resolver concurrencia (Priority: P1)

Como médico, quiero consultar versiones y resolver concurrencia para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Impide perder cambios y permite conocer su autoría.

**Independent Test**: Abrir dos copias de la misma versión, autorizar una e intentar autorizar la otra. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** versiones previas, **When** se consultan, **Then** son de solo lectura y muestran autor, fecha y motivo cuando aplica.
2. **Given** una copia basada en una versión ya sustituida, **When** se intenta autorizar, **Then** se rechaza por versión desactualizada y se pide recargar sin sobrescribir la vigente.

### User Story 3 - Comparar cambios visualmente (Priority: P3)

Como médico, quiero comparar cambios visualmente para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: RF-37 es opcional.

**Independent Test**: Seleccionar dos versiones con la mejora habilitada. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** dos versiones distintas, **When** se comparan, **Then** se resaltan diferencias sin modificar ninguna versión.

### Edge Cases

- La misma regla de campos obligatorios de 004 aplica a las correcciones.
- Un fallo o una cancelación de autorización conserva la copia local y no altera la vigente.
- Desde la versión 2 el motivo es obligatorio; la versión inicial puede no tener motivo.

## Requirements *(mandatory)*

### Functional Requirements

P1 agrupa M; P2 agrupa S; P3 agrupa C. Esta prioridad no transforma mejoras S/C en obligaciones M.

- **FR-034** (M; RF-34): Abrir la corrección como copia local sin modificar la versión vigente antes de una nueva autorización.
- **FR-035** (M; RF-35): Exigir motivo y nueva autorización para cada corrección; crear la siguiente versión y mostrar estado Corregida.
- **FR-036** (M; RF-36): Conservar y permitir consultar versiones anteriores inmutables con autor, fecha y motivo; rechazar una corrección basada en una versión desactualizada.
- **FR-037** (C; RF-37): Permitir comparar visualmente dos versiones resaltando sus diferencias.

### Quality & Privacy Requirements

- **RNF-01**: Usar solo datos ficticios y mostrar la etiqueta Datos ficticios.
- **RNF-02**: No persistir audio ni información clínica de la consulta antes de autorizar; tampoco en registros de depuración.
- **RNF-04**: Exigir autenticación en las operaciones clínicas; proteger las integraciones y no exponer credenciales al usuario.
- **RNF-06**: Eliminar el borrador local al autorizar con éxito o descartar con confirmación.
- **RNF-08**: Interfaz en español de México, tratamiento de tú y accesibilidad WCAG 2.2 AA; los estados no dependen solo del color.

### Key Entities

Nota: identidad estable y versión vigente. Versión: contenido inmutable, número, médico, fecha y motivo. Copia de corrección: trabajo local basado en una versión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La corrección autorizada produce v2 con motivo y conserva v1 sin cambios, verificando contenido y metadatos.
- **SC-002**: Una corrección sin motivo y una basada en versión desactualizada se rechazan sin incrementar la versión.
- **SC-003**: Descartar la copia local no cambia la nota ni su historial.
- **SC-004**: Todas las versiones anteriores son consultables en solo lectura con su médico y fecha.

## Assumptions

- Un solo rol médico; escritorio, Chrome/Edge recientes y conexión a internet. Datos de demo ficticios.
- Dependencias: 004 proporciona una nota autorizada; puede probarse con una nota ficticia precargada. 001 muestra el expediente.
- Decisiones y verificaciones: P-06 para la conservación de transcripción; la guía de backend conserva la transcripción vigente al corregir. Véase [registro transversal](../DECISIONES.md). Según §16 se trabaja con las recomendaciones mientras no se resuelvan.
- Las reglas detalladas de campos de §7.2–7.3 son el inventario de aceptación de la plantilla; no se reduce el formato a los ejemplos de esta especificación.
- Fuera de alcance: agenda, citas, firma electrónica, otros roles, FHIR, plantillas por especialidad, sincronización sin conexión y coordinación de varias pestañas.

## Sources & Traceability

- Fuente normativa: [REQUERIMIENTOS](../../docs/REQUERIMIENTOS.md), §§6–12 y §16; prevalece sobre la propuesta inicial.
- Detalle de interacción: [guía frontend](../../docs/equipo/german-frontend.md).
- Contratos y reglas de guardado: [guía backend](../../docs/equipo/jeroben-backend.md).
- Esquema, extracción y evaluación: [guía IA](../../docs/equipo/luis-ia.md).
- [Design System v0.4](../../docs/referencias/design-system-clinico-v0.4.html), con adaptaciones de §10.2; plantilla v1.1 según §7.
- Backlog relacionado (referencia, no tareas generadas): VC-17.
- Aceptación de origen: CA-09.
