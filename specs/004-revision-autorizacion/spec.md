# Feature Specification: Revisión del borrador y autorización de la nota

**Feature Branch**: `work` (rama existente compartida; no se crean ramas automáticamente).

**Feature Directory**: `specs/004-revision-autorizacion`

**Created**: 2026-10-28

**Status**: Draft — derivada de documentos; recomendaciones pendientes registradas.

**Input**: Crear especificaciones con los documentos del repositorio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Revisar y recuperar el borrador (Priority: P1)

Como médico, quiero revisar y recuperar el borrador para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: El médico conserva el control antes de guardar en el expediente.

**Independent Test**: Editar una plantilla sintética, recargar y comprobar que no hay nueva consulta persistida en el servidor. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** un borrador prellenado, **When** se recorren las ocho secciones navegables de 02 a 09 en cualquier orden, **Then** los campos clínicos son editables y la identificación del paciente y médico es de solo lectura.
2. **Given** un campo de IA, **When** el médico lo modifica, **Then** su origen pasa a Editado; uno vacío completado por el médico pasa a Manual.
3. **Given** cambios ya autoguardados, **When** se recarga la pantalla, **Then** se recupera el borrador del paciente y el indicador aclara que no está en el expediente.
4. **Given** un borrador existente, **When** se solicita descartarlo, **Then** se pide confirmación; cancelar lo conserva y confirmar lo elimina.

### User Story 2 - Autorizar en el expediente correcto (Priority: P1)

Como médico, quiero autorizar en el expediente correcto para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: Es el único punto que incorpora la nota al expediente.

**Independent Test**: Completar datos mínimos, cancelar una autorización y luego confirmarla. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** campos obligatorios faltantes, **When** se intenta autorizar, **Then** se impide y se indica qué falta con acceso al campo.
2. **Given** un borrador válido, **When** se solicita autorizar, **Then** el diálogo identifica al paciente y expediente, explica las versiones e indica cuántos campos de IA quedaron sin cambios.
3. **Given** el médico autenticado confirma, **When** la autorización tiene éxito, **Then** se guardan juntos nota y versión 1 con contenido, orígenes, transcripción según P-06, modo, consentimiento, autor y fecha; luego se elimina el borrador local.
4. **Given** fallo de autorización o sesión inválida, **When** se intenta guardar, **Then** no queda una nota parcial y se conserva el borrador para corregir o reintentar.

### User Story 3 - Revisar evidencia y signos vitales (Priority: P2)

Como médico, quiero revisar evidencia y signos vitales para documentar y consultar la atención del paciente seleccionado.

**Why this priority**: RF-27 y RF-28 son deseables.

**Independent Test**: Usar un vital imposible y otro fuera de referencia, y enfocar un campo con evidencia. Las dependencias se pueden preparar con datos ficticios; independencia de prueba no implica ausencia de dependencias de entrega.

**Acceptance Scenarios**:

1. **Given** un vital imposible, **When** se intenta autorizar con la mejora habilitada, **Then** se bloquea hasta corregir; un valor fuera de referencia solo advierte.
2. **Given** un campo respaldado, **When** se enfoca, **Then** se muestra su evidencia y se resalta en la transcripción con hablantes en Consulta.

### Edge Cases

- Borrar un valor de IA deja el campo vacío con origen Editado: otro audio no debe reponerlo automáticamente.
- El índice no exige completar una sección para visitar otra; la validación de obligatorios ocurre al autorizar.
- Con almacenamiento local no disponible no se debe afirmar que el borrador quedó guardado; recuperación y tratamiento definitivo se documentan en el plan.
- Cancelar el diálogo no escribe nada. Un fallo del guardado nunca elimina el único borrador.
- Los rangos de signos vitales de ejemplo no constituyen validación clínica; en menores solo se usan límites imposibles según la guía.

## Requirements *(mandatory)*

### Functional Requirements

P1 agrupa M; P2 agrupa S; P3 agrupa C. Esta prioridad no transforma mejoras S/C en obligaciones M.

- **FR-022** (M; RF-22): Mostrar el Formato Clínico General v1.1 completo y permitir recorrer las secciones en cualquier orden.
- **FR-023** (M; RF-23): Permitir editar los campos clínicos de las secciones 02–08; mantener identificación personal y profesional de solo lectura conforme a P-01. Fecha, hora y tipo de atención sí son editables.
- **FR-024** (M; RF-24): Mostrar origen IA, Editado o Manual y distinguir Negado de — Sin información; borrar un campo de IA conserva su origen Editado.
- **FR-025** (M; RF-25): Autoguardar el borrador por paciente en el navegador, recuperarlo tras recarga y mostrar Borrador · solo en este equipo · no está en el expediente.
- **FR-026** (M; RF-26): Solicitar confirmación antes de descartar y eliminar el borrador solo si se confirma.
- **FR-027** (S; RF-27): Mostrar transcripción en panel lateral con hablantes de Consulta y resaltar la evidencia al enfocar el campo.
- **FR-028** (S; RF-28): Bloquear valores vitales imposibles, advertir sin bloquear valores fuera de referencia y calcular IMC cuando peso y talla lo permitan; aplicar también a valores de IA.
- **FR-029** (M; RF-29): Permitir agregar, editar y eliminar renglones de diagnósticos y medicamentos.
- **FR-030** (M; RF-30): Impedir autorizar mientras falten obligatorios e indicar cuáles faltan con acceso al campo; aplicar el conjunto provisional P-04 descrito en Assumptions.
- **FR-031** (M; RF-31): Confirmar autorización mostrando paciente, expediente, consecuencia de guardar, posibilidad de corregir mediante versiones y número de campos IA sin cambios.
- **FR-032** (M; RF-32): Guardar conjuntamente nota y versión inicial, contenido, orígenes, modo, consentimiento, médico y fecha/hora, y transcripción según P-06; limpiar borrador solo tras éxito.
- **FR-033** (M; RF-33): Rechazar toda creación de nota sin autorización explícita del médico con sesión válida; la identidad del autor corresponde a esa sesión.

### Quality & Privacy Requirements

- **RNF-01**: Usar solo datos ficticios y mostrar la etiqueta Datos ficticios.
- **RNF-02**: No persistir audio ni información clínica de la consulta antes de autorizar; tampoco en registros de depuración.
- **RNF-04**: Exigir autenticación en las operaciones clínicas; proteger las integraciones y no exponer credenciales al usuario.
- **RNF-06**: Eliminar el borrador local al autorizar con éxito o descartar con confirmación.
- **RNF-08**: Interfaz en español de México, tratamiento de tú y accesibilidad WCAG 2.2 AA; los estados no dependen solo del color.
- **RNF-09**: La IA documenta; no diagnostica, prescribe ni sugiere tratamiento.

### Key Entities

Borrador local por paciente: plantilla, campos, origen y alertas. Nota autorizada: paciente, médico, atención y versión inicial. Campo: valor, estado, evidencia y origen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tras autoguardar y recargar se recuperan los valores y sus orígenes; tras descartar confirmado se eliminan.
- **SC-002**: Procesamiento y edición generan cero registros de la consulta antes de autorizar.
- **SC-003**: Todos los casos con obligatorios faltantes rechazan autorización y señalan los campos; se admite plan con medicamento o con medidas.
- **SC-004**: Una autorización válida crea una sola versión inicial en el expediente elegido y elimina el borrador solo después del éxito.
- **SC-005**: La ausencia de sesión válida impide crear la nota incluso si se omite la validación de pantalla.

## Assumptions

- Un solo rol médico; escritorio, Chrome/Edge recientes y conexión a internet. Datos de demo ficticios.
- Dependencias: 001 proporciona paciente y médico. 003 aporta el prellenado; se puede probar con un borrador sintético preparado. 005 gestiona las correcciones posteriores.
- Decisiones y verificaciones: P-01, P-02, P-03, P-04, P-06; recomendaciones provisionales según §16. Véase [registro transversal](../DECISIONES.md). Según §16 se trabaja con las recomendaciones mientras no se resuelvan.
- P-04 provisional: fecha, hora y tipo de consulta; motivo y padecimiento con valor; al menos un diagnóstico con descripción y condición; un medicamento o medidas de seguimiento. En Consulta se exige consentimiento. P-02 usa cm, P-03 Primera vez/Seguimiento y P-06 conserva texto de transcripción, nunca audio.
- Las reglas detalladas de campos de §7.2–7.3 son el inventario de aceptación de la plantilla; no se reduce el formato a los ejemplos de esta especificación.
- Fuera de alcance: agenda, citas, firma electrónica, otros roles, FHIR, plantillas por especialidad, sincronización sin conexión y coordinación de varias pestañas.

## Sources & Traceability

- Fuente normativa: [REQUERIMIENTOS](../../docs/REQUERIMIENTOS.md), §§6–12 y §16; prevalece sobre la propuesta inicial.
- Detalle de interacción: [guía frontend](../../docs/equipo/german-frontend.md).
- Contratos y reglas de guardado: [guía backend](../../docs/equipo/jeroben-backend.md).
- Esquema, extracción y evaluación: [guía IA](../../docs/equipo/luis-ia.md).
- [Design System v0.4](../../docs/referencias/design-system-clinico-v0.4.html), con adaptaciones de §10.2; plantilla v1.1 según §7.
- Backlog relacionado (referencia, no tareas generadas): VC-07, VC-08, VC-15, VC-16, VC-19, VC-21.
- Aceptación de origen: CA-02, CA-03, CA-04, CA-06, CA-07, CA-08.
